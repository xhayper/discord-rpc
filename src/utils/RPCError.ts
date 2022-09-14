import { CUSTOM_RPC_ERROR_CODE, RPC_ERROR_CODE } from "../structures/Transport";

export class RPCError extends Error {
    code: RPC_ERROR_CODE | CUSTOM_RPC_ERROR_CODE;
    message: string = "";

    get name() {
        return `${{ ...CUSTOM_RPC_ERROR_CODE, ...RPC_ERROR_CODE }[this.code]}`;
    }

    constructor(errorCode: CUSTOM_RPC_ERROR_CODE | RPC_ERROR_CODE, message?: string, options?: ErrorOptions) {
        super(message, options);

        this.code = errorCode;
        this.message = message ?? this.message;
    }
}
