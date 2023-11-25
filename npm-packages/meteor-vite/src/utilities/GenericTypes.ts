export type DeepPartial<TObject> = TObject extends {} ? {
    [key in keyof TObject]?: DeepPartial<TObject[key]>
} : TObject;

export type MakeOptional<
    TObject extends object,
    TKeys extends keyof TObject
> = Omit<TObject, TKeys> & Partial<Pick<TObject, TKeys>>;