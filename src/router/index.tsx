import { createBrowserRouter, Navigate } from 'react-router-dom'
import UniversalPage from '../pages/UniversalPage'
import AdminBuilderPage from '../pages/AdminBuilderPage'
import NotFoundPage from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/admin/builder', element: <AdminBuilderPage /> },
  { path: '/:merchantId/:pageKey', element: <UniversalPage /> },
  { path: '/:merchantId', element: <Navigate to="/merchant_demo/home" replace /> },
  { path: '/', element: <Navigate to="/merchant_demo/home" replace /> },
  { path: '*', element: <NotFoundPage /> }
])
