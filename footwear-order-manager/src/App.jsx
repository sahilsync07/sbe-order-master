import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { OrderProvider } from './context/OrderContext';
import { HistoryProvider } from './context/HistoryContext';
import Dashboard from './pages/Dashboard';
import OrderDetails from './pages/OrderDetails';

function App() {
  return (
    <HistoryProvider>
      <OrderProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/order/:id" element={<OrderDetails />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </OrderProvider>
    </HistoryProvider>
  );
}

export default App;
