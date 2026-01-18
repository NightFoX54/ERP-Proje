/**
 * JWT Token utility functions
 * JWT token'ı decode edip expiration kontrolü yapar
 */

/**
 * JWT token'ı decode eder ve payload'u döner
 * @param {string} token - JWT token
 * @returns {object|null} - Decode edilmiş payload veya null
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    // JWT token formatı: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Payload kısmını decode et (base64url)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Token'ın süresinin dolup dolmadığını kontrol eder
 * @param {string} token - JWT token
 * @returns {boolean} - true if token is expired or invalid, false if valid
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    // exp Unix timestamp (seconds), Date.now() milliseconds
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    
    // Token 5 dakika içinde süresi dolacaksa da expired sayılabilir (opsiyonel)
    // Şimdilik sadece süresi dolmuş olanları kontrol edelim
    return currentTime >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Token'ın kaç milisaniye sonra süresinin dolacağını döner
 * @param {string} token - JWT token
 * @returns {number|null} - Milliseconds until expiration, or null if invalid
 */
export const getTokenExpirationTime = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return null;
    
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    return Math.max(0, expirationTime - currentTime);
  } catch (error) {
    console.error('Error getting token expiration time:', error);
    return null;
  }
};

/**
 * Token'ın ne zaman oluşturulduğunu (issued at) döner
 * @param {string} token - JWT token
 * @returns {number|null} - Issued at timestamp in milliseconds, or null if invalid
 */
export const getTokenIssuedAt = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.iat) return null;
    
    // iat Unix timestamp (seconds)
    return decoded.iat * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error getting token issued at:', error);
    return null;
  }
};
