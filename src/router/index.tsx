import { createBrowserRouter, Navigate } from 'react-router-dom'
import ScreenPage from '../pages/ScreenPage'
import AdminBuilderPage from '../pages/AdminBuilderPage'
import NotFoundPage from '../pages/NotFoundPage'
import { DEFAULT_MERCHANT, DEFAULT_SCREEN } from '../sdui/config'

export const router = createBrowserRouter([
  { path: '/admin/builder', element: <AdminBuilderPage /> },
  { path: '/:merchantId/:screenKey', element: <ScreenPage /> },
  { path: '/:merchantId', element: <Navigate to={`/${DEFAULT_MERCHANT}/${DEFAULT_SCREEN}`} replace /> },
  { path: '/', element: <Navigate to={`/${DEFAULT_MERCHANT}/${DEFAULT_SCREEN}`} replace /> },
  { path: '*', element: <NotFoundPage /> }
])
