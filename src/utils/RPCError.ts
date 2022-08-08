import { CUSTOM_RPC_ERROR_CODE, RPC_ERROR_CODE } from "../structures/Transport";

export class RPCError extends Error {
    constructor(errorCode: CUSTOM_RPC_ERROR_CODE | RPC_ERROR_CODE, message?: string, options?: ErrorOptions) {
        super(message, options);
        this.name = `${{ ...CUSTOM_RPC_ERROR_CODE, ...RPC_ERROR_CODE }[errorCode]}`;
    }
}
