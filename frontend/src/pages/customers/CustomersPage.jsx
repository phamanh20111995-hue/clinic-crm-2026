import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import CustomerTable from '../../components/customers/CustomerTable'

export default function CustomersPage() {
  const [count, setCount] = useState(0)

  return (
    <AppLayout
      title="Khách hàng"
      meta={`${count} khách`}
    >
      <CustomerTable baseParams={{ is_customer: true }} onCountChange={setCount} />
    </AppLayout>
  )
}
