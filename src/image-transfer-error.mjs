export const imageFailureReasons = Object.freeze(['http', 'range-metadata', 'size', 'integrity', 'timeout', 'storage', 'transfer']);

export class ImageTransferError extends Error {
  constructor(message, reason, httpStatus) { super(message); this.reason = reason; this.httpStatus = httpStatus; }
}

// Never include upstream messages, URLs, headers or bodies in launch telemetry.
export function imageFailureDetails(error, signal) {
  const reason = error instanceof ImageTransferError && imageFailureReasons.includes(error.reason) ? error.reason
    : signal?.reason?.name === 'TimeoutError' || error?.name === 'TimeoutError' ? 'timeout'
    : ['ENOSPC', 'EDQUOT', 'EACCES', 'EPERM', 'EROFS', 'EIO', 'EMFILE', 'ENFILE', 'EEXIST', 'ENOENT'].includes(error?.code) ? 'storage' : 'transfer';
  return {reason, ...(reason === 'http' && Number.isInteger(error.httpStatus) && error.httpStatus >= 100 && error.httpStatus <= 599 ? {httpStatus:error.httpStatus} : {})};
}
