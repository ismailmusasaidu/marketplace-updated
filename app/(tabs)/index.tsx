import { useAuth } from '@/contexts/AuthContext';
import CustomerHome from '@/components/home/CustomerHome';
import VendorHome from '@/components/home/VendorHome';
import AdminHome from '@/components/home/AdminHome';

export default function HomeScreen() {
  const { profile } = useAuth();

  if (!profile) {
    return null;
  }

  if (profile.role === 'vendor') {
    return <VendorHome />;
  }

  if (profile.role === 'admin') {
    return <AdminHome />;
  }

  return <CustomerHome />;
}
