export interface SmockVariable {
    reset: () => void;
    will: {
        be: (...args: any[]) => void;
    };
}
export interface SmockFunction {
    reset: () => void;
    will: {
        return: {
            (): void;
            with: (...args: any[]) => void;
        };
        revert: {
            (): void;
            with: (...args: any[]) => void;
        };
    };
}
export interface SmockLibrary {
    smocked: {
        functions: {
            [name: string]: SmockFunction;
        };
    };
}
export interface SmockContract {
    smocked: {
        id: string;
        address: string;
        fallback: SmockFunction;
        functions: {
            [name: string]: SmockFunction;
        };
    };
}
export interface MagicSmockContract {
    smocked: {
        id: string;
        address: string;
        fallback: SmockFunction;
        functions: {
            [name: string]: SmockFunction;
        };
        internal: {
            functions: {
                [name: string]: SmockFunction;
            };
            variables: {
                [name: string]: SmockVariable;
            };
        };
    };
}
export declare type Smockit<TSmockSpec, TSmockOptions, TSmockHost extends SmockContract> = (spec: TSmockSpec, options?: TSmockOptions) => Promise<TSmockHost>;
export declare type Smagicit<TSmagicSpec, TSmagicOptions, TSmagicHost extends MagicSmockContract> = (spec: TSmagicSpec, options?: TSmagicOptions) => Promise<TSmagicHost>;
export declare type Smock<TSmockSpec, TSmockOptions, TSmockHost extends SmockContract, TSmagicSpec, TSmagicOptions, TSmagicHost extends MagicSmockContract> = Smockit<TSmockSpec, TSmockOptions, TSmockHost> & {
    magic: Smagicit<TSmagicSpec, TSmagicOptions, TSmagicHost>;
};