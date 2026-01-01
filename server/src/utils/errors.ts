/**
 * 自定义错误类
 */

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';

    // 保持原型链
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string = '请求参数错误', details?: any) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message: string = '未授权') {
    return new ApiError(401, message);
  }

  static forbidden(message: string = '没有权限') {
    return new ApiError(403, message);
  }

  static notFound(message: string = '资源不存在') {
    return new ApiError(404, message);
  }

  static conflict(message: string = '资源冲突') {
    return new ApiError(409, message);
  }

  static tooManyRequests(message: string = '请求过于频繁') {
    return new ApiError(429, message);
  }

  static internal(message: string = '服务器内部错误') {
    return new ApiError(500, message);
  }
}
