import {
    is,
    isAssignmentExpression,
    isIdentifier,
    isMemberExpression,
    isObjectExpression,
    isObjectProperty,
    isStringLiteral,
    Node,
    traverse,
    VariableDeclarator,
} from '@babel/types';
import Logger from '../../utilities/Logger';
import { PackageModule } from './PackageModule';
import { ModuleList, propParser } from './Parser';
import { ModuleExportsError } from './ParserError';
import { MeteorInstallCallExpression, MeteorInstallMeteorProperty, MeteorPackageProperty } from './ParserTypes';

/**
 * Parser for a build Meteor package's meteorInstall() call.
 * Traverses through all the entries in the passed object to build up a map of each file exposed by the package
 * as well as tracking exports (module.export, module.exportDefault) and re-exports (module.link).
 * {@link https://github.com/JorgenVatle/meteor-vite/blob/8b0a7a5f5f95d78661793e8b4bc7f266c1081ed9/npm-packages/meteor-vite/test/__mocks/meteor-bundle/rdb_svelte-meteor-data.js#L25 example of meteorInstall() }
 */
export class MeteorInstall {
    public readonly modules: ModuleList = {};
    public readonly packageId: string;
    public readonly name: string;
    public readonly type: 'atmosphere' | 'npm';
    
    constructor({ packageId, name, type }: Pick<MeteorInstall, 'packageId' | 'name' | 'type'>) {
        this.packageId = packageId;
        this.name = name;
        this.type = type;
    }
    
    public static parse(node: Node) {
        const atmosphereInstall = this.parseAtmosphereInstall(node);
        const npmInstall = this.parseNpmInstall(node);
        
        if (atmosphereInstall) {
            return atmosphereInstall;
        }
        return npmInstall;
    }
    
    protected static parseInstall(node: MeteorInstallCallExpression) {
        const [modules, fileExtensions] = node.arguments;
        const node_modules = modules.properties[0];
        if (propParser.getKey(node_modules) !== 'node_modules') {
            return {
                type: 'unknown',
            };
        }
        const meteor = node_modules.value.properties[0];
        if (propParser.getKey(meteor) === 'meteor') {
            return {
                type: 'atmosphere',
                meteor: meteor as MeteorInstallMeteorProperty,
            };
        }
        return {
            type: 'npm',
            node_modules,
        };
    }
    
    protected static parseAtmosphereInstall(node: Node) {
        if (!this.isRequireDeclaration(node)) return;
        if (!this.isMeteorInstall(node.init)) return;
        
        
        const { meteor, type } = this.parseInstall(node.init);
        if (type !== 'atmosphere' || !meteor) {
            return;
        }
        
        const packageName = meteor.value.properties[0];
        const packageModules = packageName.value.properties;
        
        const meteorPackage = new this({
            packageId: `${propParser.getKey(meteor)}/${propParser.getKey(packageName)}`,
            name: propParser.getKey(packageName),
            type: 'atmosphere',
        });
        
        meteorPackage.traverseModules(packageModules, '');
        
        return meteorPackage;
    }
    
    protected static parseNpmInstall(node: Node) {
        if (!this.isMeteorInstall(node)) return;
        const { node_modules, type } = this.parseInstall(node);
        if (type !== 'npm' || !node_modules) {
            return;
        }
        
        const npmPackages = [];
        for (const directory of node_modules.value.properties) {
            if (!isObjectExpression(directory.value)) return; // Not a directory
            const packageJson = {
                name: '',
                main: '',
                version: '',
            };
            
            for (const entry of directory.value.properties) {
                if (!isObjectProperty(entry)) {
                    Logger.warn(`Parsed an unexpected property from meteorInstall node module (${entry.type})`, entry);
                    return;
                }
                if (propParser.getKey(entry) === 'package.json') {
                    // Parse package.json contents
                    traverse(entry.value, {
                        enter(node) {
                            if (!isAssignmentExpression(node)) return;
                            if (!isMemberExpression(node.left)) return;
                            if (!isObjectExpression(node.right)) return;
                            if (!isIdentifier(node.left.object, { name: 'module' })) {
                                throw new ModuleExportsError('Unexpected package.json export object', node.left.object);
                            }
                            if (!isIdentifier(node.left.property, { name: 'exports' })) {
                                throw new ModuleExportsError('Unexpected package.json export property', node.left.property)
                            }
                            
                            for (const prop of node.right.properties) {
                                if (!isObjectProperty(prop)) {
                                    throw new ModuleExportsError('package.json had an unexpected property export', prop);
                                }
                                const key = propParser.getKey(prop);
                                if (!isStringLiteral(prop.value)) {
                                    throw new ModuleExportsError(`package.json '${key}' field had an unexpected value`, prop.value);
                                }
                                
                                switch (key) {
                                    case 'version':
                                    case 'main':
                                    case 'name':
                                        packageJson[key] = prop.value.value;
                                        break;
                                    default:
                                        throw new ModuleExportsError(`Unknown key: ${key}`, prop);
                                }
                            }
                        },
                    });
                }
                // Todo: Recurse through all directories
                // todo: Track exported modules
            }
            
            npmPackages.push(packageJson);
        }
    }
    
    protected static isRequireDeclaration(node: Node): node is VariableDeclarator {
        if (node.type !== 'VariableDeclarator') return false;
        if (node.id.type !== 'Identifier') return false;
        if (node.id.name !== 'require') return false;
        
        return true;
    }
    
    protected static isMeteorInstall(expression?: Node | null): expression is MeteorInstallCallExpression {
        if (!expression) return false;
        if (expression.type !== 'CallExpression') return false;
        if (!is('Identifier', expression.callee, { name: 'meteorInstall' })) return false;
        
        return true;
    }
    
    public traverseModules(properties: MeteorPackageProperty[], parentPath: string) {
        properties.forEach((property) => {
            const path = `${parentPath}${property.key.value.toString()}`;
            const module = new PackageModule();
            
            
            if (property.value.type === 'ObjectExpression') {
                return this.traverseModules(property.value.properties, `${path}/`);
            }
            
            traverse(property.value.body, {
                enter(node) {
                    module.parse(node);
                },
            });
            
            this.modules[path] = module.exports;
        });
    }
    
}