import { CUSTOM_RPC_ERROR_CODE, RPC_ERROR_CODE } from "../structures/Transport";

export class RPCError extends Error {
    public code: RPC_ERROR_CODE | CUSTOM_RPC_ERROR_CODE;
    public override message: string = "";

    public override get name() {
        return `${{ ...CUSTOM_RPC_ERROR_CODE, ...RPC_ERROR_CODE }[this.code]}`;
    }

    constructor(errorCode: CUSTOM_RPC_ERROR_CODE | RPC_ERROR_CODE, message?: string, options?: ErrorOptions) {
        super(message, options);

        this.code = errorCode;
        this.message = message ?? this.message;
    }
}
