const crypto = require('crypto');

class PasswordService {
  constructor() {
    this.length = 12; // Tamanho da senha gerada
    this.includeUppercase = true;
    this.includeLowercase = true;
    this.includeNumbers = true;
    this.includeSymbols = true;
    this.excludeSimilar = true; // Excluir caracteres similares como 0, O, l, I
  }

  /**
   * Gera uma senha segura aleatória
   * @returns {string} Senha gerada
   */
  generateSecurePassword() {
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const symbols = '!@#$%&*+=?';

    let charset = '';
    let password = '';

    // Construir charset baseado nas configurações
    if (this.includeLowercase) charset += lowercase;
    if (this.includeUppercase) charset += uppercase;
    if (this.includeNumbers) charset += numbers;
    if (this.includeSymbols) charset += symbols;

    // Garantir que pelo menos um caractere de cada tipo seja incluído
    if (this.includeLowercase) {
      password += this.getRandomChar(lowercase);
    }
    if (this.includeUppercase) {
      password += this.getRandomChar(uppercase);
    }
    if (this.includeNumbers) {
      password += this.getRandomChar(numbers);
    }
    if (this.includeSymbols) {
      password += this.getRandomChar(symbols);
    }

    // Completar o resto da senha
    const remainingLength = this.length - password.length;
    for (let i = 0; i < remainingLength; i++) {
      password += this.getRandomChar(charset);
    }

    // Embaralhar a senha para evitar padrões
    return this.shuffleString(password);
  }

  /**
   * Obtém um caractere aleatório de uma string
   * @param {string} str 
   * @returns {string}
   */
  getRandomChar(str) {
    const randomIndex = crypto.randomInt(0, str.length);
    return str[randomIndex];
  }

  /**
   * Embaralha uma string usando Fisher-Yates shuffle
   * @param {string} str 
   * @returns {string}
   */
  shuffleString(str) {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }

  /**
   * Gera uma senha personalizada com tamanho específico
   * @param {number} length 
   * @returns {string}
   */
  generatePassword(length = 12) {
    this.length = length;
    return this.generateSecurePassword();
  }

  /**
   * Valida se uma senha é segura
   * @param {string} password 
   * @returns {object} {isValid: boolean, errors: string[]}
   */
  validatePassword(password) {
    const errors = [];
    
    if (!password || password.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
    
    if (!/[!@#$%&*+=?]/.test(password)) {
      errors.push('A senha deve conter pelo menos um símbolo especial');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new PasswordService();
