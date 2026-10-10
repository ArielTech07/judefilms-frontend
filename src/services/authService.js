import api from "./api";

export const login = async (username, password) => {
  try {
    const response = await api.post('/users/login', { username, password });
    const { token, username: user, message } = response.data;
    sessionStorage.setItem('jf_token', token);
    sessionStorage.setItem('jf_session', JSON.stringify({
      user,
      loginAt: new Date().toISOString()
    }));
    return { success: true, session: { user } };
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Usuario o contraseña incorrectos';
    return { success: false, error: errorMsg };
  }
};

export const logout = () => {
  sessionStorage.removeItem('jf_token');
  sessionStorage.removeItem('jf_session');
};

export const isTokenValid = () => {
  const token = sessionStorage.getItem('jf_token');
  if (!token) return false;

  try {
    // Decodificar payload del JWT para verificar expiración
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch {
    return false;
  }
};