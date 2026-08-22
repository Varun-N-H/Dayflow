import { redirect } from 'next/navigation';

export default function HomePage() {
  // Directly redirect to /employees dashboard or /signin
  redirect('/employees');
}
