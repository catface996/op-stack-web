import { ToolFormData, ValidationError } from '../types';

export class ValidationService {
  /**
   * 验证工具表单数据
   */
  static validateToolForm(data: Partial<ToolFormData>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate name
    if (!data.name || data.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Tool name is required',
        code: 'required'
      });
    } else if (data.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Tool name cannot exceed 100 characters',
        code: 'maxLength'
      });
    } else if (data.name.length < 1) {
      errors.push({
        field: 'name',
        message: 'Tool name must be at least 1 character',
        code: 'minLength'
      });
    }

    // Validate description
    if (data.description && data.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Tool description cannot exceed 500 characters',
        code: 'maxLength'
      });
    }

    // Validate type
    if (!data.type) {
      errors.push({
        field: 'type',
        message: 'Please select a tool type',
        code: 'required'
      });
    } else if (!['Function', 'Integration', 'Retrieval'].includes(data.type)) {
      errors.push({
        field: 'type',
        message: 'Invalid tool type',
        code: 'invalid'
      });
    }

    return errors;
  }

  /**
   * 验证工具名称格式
   */
  static validateToolName(name: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!name || name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Tool name is required',
        code: 'required'
      });
      return errors;
    }

    const trimmedName = name.trim();

    // Length validation
    if (trimmedName.length < 1) {
      errors.push({
        field: 'name',
        message: 'Tool name must be at least 1 character',
        code: 'minLength'
      });
    }

    if (trimmedName.length > 100) {
      errors.push({
        field: 'name',
        message: 'Tool name cannot exceed 100 characters',
        code: 'maxLength'
      });
    }

    // Character validation - allow letters, numbers, Chinese, spaces, hyphens, underscores
    const namePattern = /^[\w\s\u4e00-\u9fff-]+$/;
    if (!namePattern.test(trimmedName)) {
      errors.push({
        field: 'name',
        message: 'Tool name can only contain letters, numbers, Chinese characters, spaces, hyphens and underscores',
        code: 'invalidFormat'
      });
    }

    return errors;
  }

  /**
   * 验证工具描述
   */
  static validateToolDescription(description: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (description && description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Tool description cannot exceed 500 characters',
        code: 'maxLength'
      });
    }

    return errors;
  }

  /**
   * Get friendly error message
   */
  static getErrorMessage(error: ValidationError): string {
    const errorMessages: Record<string, string> = {
      required: 'This field is required',
      minLength: 'Input is too short',
      maxLength: 'Input is too long',
      invalid: 'Invalid input',
      invalidFormat: 'Invalid format',
      unique: 'This name is already in use'
    };

    return errorMessages[error.code] || error.message;
  }

  /**
   * 检查是否有错误
   */
  static hasErrors(errors: ValidationError[]): boolean {
    return errors.length > 0;
  }

  /**
   * 获取特定字段的错误
   */
  static getFieldErrors(errors: ValidationError[], field: string): ValidationError[] {
    return errors.filter(error => error.field === field);
  }

  /**
   * 获取特定字段的第一个错误消息
   */
  static getFirstFieldError(errors: ValidationError[], field: string): string | null {
    const fieldErrors = this.getFieldErrors(errors, field);
    return fieldErrors.length > 0 ? this.getErrorMessage(fieldErrors[0]) : null;
  }
}

export default ValidationService;