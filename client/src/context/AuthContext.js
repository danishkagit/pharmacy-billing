import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.user) {
          setUser(parsed.user);
          setCompany(parsed.company);
          setBranch(parsed.branch);
        }
        API.get('/auth/me').then(res => {
          if (res.success) {
            setUser(res.data.user);
            setCompany(res.data.company);
            setBranch(res.data.branch);
            localStorage.setItem('user', JSON.stringify({ user: res.data.user, company: res.data.company, branch: res.data.branch }));
          }
        }).catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        });
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ user: res.data.user, company: res.data.company, branch: res.data.branch }));
      setUser(res.data.user);
      setCompany(res.data.company);
      setBranch(res.data.branch);
    }
    return res;
  };

  const register = async (data) => {
    const res = await API.post('/auth/register', data);
    if (res.success) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ user: res.data.user, company: res.data.company, branch: res.data.branch }));
      setUser(res.data.user);
      setCompany(res.data.company);
      setBranch(res.data.branch);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCompany(null);
    setBranch(null);
    window.location.href = '/login';
  };

  const hasPermission = (perm) => {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'admin') return true;
    return user.permissions?.[perm] === true;
  };

  return (
    <AuthContext.Provider value={{ user, company, branch, loading, login, register, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
