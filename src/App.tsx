/**
 * App — RouterProvider only (pages handle API via hook + service-repo)
 */
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

export default function App() {
  return <RouterProvider router={router} />
}
