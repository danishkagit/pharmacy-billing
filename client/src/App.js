import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';

import MedicineList from './pages/MedicineList';
import MedicineForm from './pages/MedicineForm';
import MedicineImport from './pages/MedicineImport';
import BatchList from './pages/BatchList';
import ExpiryDashboard from './pages/ExpiryDashboard';

import PurchaseInvoiceList from './pages/PurchaseInvoiceList';
import PurchaseInvoiceCreate from './pages/PurchaseInvoiceCreate';
import SaleInvoiceCreate from './pages/SaleInvoiceCreate';
import SaleInvoiceList from './pages/SaleInvoiceList';
import SaleInvoiceView from './pages/SaleInvoiceView';

import CustomerList from './pages/CustomerList';
import CustomerForm from './pages/CustomerForm';
import SupplierList from './pages/SupplierList';
import SupplierForm from './pages/SupplierForm';

import DoctorList from './pages/DoctorList';
import PatientList from './pages/PatientList';
import PrescriptionList from './pages/PrescriptionList';
import PrescriptionForm from './pages/PrescriptionForm';

import PaymentList from './pages/PaymentList';
import ExpenseList from './pages/ExpenseList';
import ExpenseForm from './pages/ExpenseForm';

import GSTR1Report from './pages/GSTR1Report';
import GSTR3BReport from './pages/GSTR3BReport';
import SalesReport from './pages/SalesReport';
import OutstandingReport from './pages/OutstandingReport';
import ProfitLossReport from './pages/ProfitLossReport';

import CompanySetup from './pages/CompanySetup';
import BranchSetup from './pages/BranchSetup';
import StaffManagement from './pages/StaffManagement';
import Settings from './pages/Settings';
import BarcodeGenerator from './pages/BarcodeGenerator';

import NarcoticsRegister from './pages/NarcoticsRegister';
import DrugScheduleLog from './pages/DrugScheduleLog';
import DeliveryOrderList from './pages/DeliveryOrderList';
import AuditTrail from './pages/AuditTrail';

import SaleReturnList from './pages/SaleReturnList';
import SaleReturnCreate from './pages/SaleReturnCreate';
import PurchaseReturnList from './pages/PurchaseReturnList';
import PurchaseReturnCreate from './pages/PurchaseReturnCreate';
import CreditNoteList from './pages/CreditNoteList';
import EInvoicePage from './pages/EInvoicePage';
import DrugLicenseManager from './pages/DrugLicenseManager';

import PurchaseOrderList from './pages/PurchaseOrderList';
import PurchaseOrderCreate from './pages/PurchaseOrderCreate';
import TransferList from './pages/TransferList';
import TransferCreate from './pages/TransferCreate';
import StockAdjustmentList from './pages/StockAdjustmentList';
import StockAdjustmentCreate from './pages/StockAdjustmentCreate';
import SmsLogList from './pages/SmsLogList';
import LoyaltyPage from './pages/LoyaltyPage';
import SalesmanList from './pages/SalesmanList';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen grad-mesh">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl grad-accent flex items-center justify-center animate-pulse shadow-glow">
          <i className="fas fa-prescription-bottle-medical text-white text-lg"></i>
        </div>
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />

        <Route path="medicines" element={<MedicineList />} />
        <Route path="medicines/new" element={<MedicineForm />} />
        <Route path="medicines/:id/edit" element={<MedicineForm />} />
        <Route path="medicines/import" element={<MedicineImport />} />
        <Route path="batches" element={<BatchList />} />
        <Route path="expiry" element={<ExpiryDashboard />} />

        <Route path="purchases" element={<PurchaseInvoiceList />} />
        <Route path="purchases/new" element={<PurchaseInvoiceCreate />} />
        <Route path="sales" element={<SaleInvoiceList />} />
        <Route path="sales/new" element={<SaleInvoiceCreate />} />
        <Route path="sales/:id" element={<SaleInvoiceView />} />

        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="suppliers/new" element={<SupplierForm />} />
        <Route path="suppliers/:id/edit" element={<SupplierForm />} />

        <Route path="doctors" element={<DoctorList />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="prescriptions" element={<PrescriptionList />} />
        <Route path="prescriptions/new" element={<PrescriptionForm />} />

        <Route path="payments" element={<PaymentList />} />
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="expenses/new" element={<ExpenseForm />} />

        <Route path="gst/gstr1" element={<GSTR1Report />} />
        <Route path="gst/gstr3b" element={<GSTR3BReport />} />
        <Route path="reports/sales" element={<SalesReport />} />
        <Route path="reports/outstanding" element={<OutstandingReport />} />
        <Route path="reports/profit-loss" element={<ProfitLossReport />} />

        <Route path="company" element={<CompanySetup />} />
        <Route path="branches" element={<BranchSetup />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="barcode" element={<BarcodeGenerator />} />

        <Route path="sale-returns" element={<SaleReturnList />} />
        <Route path="sale-returns/new" element={<SaleReturnCreate />} />
        <Route path="purchase-returns" element={<PurchaseReturnList />} />
        <Route path="purchase-returns/new" element={<PurchaseReturnCreate />} />
        <Route path="credit-notes" element={<CreditNoteList />} />
        <Route path="e-invoice" element={<EInvoicePage />} />
        <Route path="drug-license" element={<DrugLicenseManager />} />

        <Route path="purchase-orders" element={<PurchaseOrderList />} />
        <Route path="purchase-orders/new" element={<PurchaseOrderCreate />} />
        <Route path="transfers" element={<TransferList />} />
        <Route path="transfers/new" element={<TransferCreate />} />
        <Route path="stock-adjustments" element={<StockAdjustmentList />} />
        <Route path="stock-adjustments/new" element={<StockAdjustmentCreate />} />
        <Route path="sms-logs" element={<SmsLogList />} />
        <Route path="loyalty" element={<LoyaltyPage />} />
        <Route path="salesmen" element={<SalesmanList />} />

        <Route path="narcotics" element={<NarcoticsRegister />} />
        <Route path="compliance" element={<DrugScheduleLog />} />
        <Route path="delivery" element={<DeliveryOrderList />} />
        <Route path="audit" element={<AuditTrail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
