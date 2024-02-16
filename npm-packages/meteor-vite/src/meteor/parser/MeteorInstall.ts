import { is, isObjectExpression, isObjectProperty, Node, traverse, VariableDeclarator } from '@babel/types';
import Logger from '../../utilities/Logger';
import { PackageModule } from './PackageModule';
import { ModuleList, propParser } from './Parser';
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
    
    constructor({ packageId, name }: Pick<MeteorInstall, 'packageId' | 'name'>) {
        this.packageId = packageId;
        this.name = name;
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
                    // Todo: fill in package.json
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