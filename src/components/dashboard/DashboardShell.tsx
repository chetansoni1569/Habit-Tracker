import { Outlet } from 'react-router-dom';
import { HabitProvider } from '../../contexts/HabitContext';
import TopNav from './TopNav';

export default function DashboardShell() {
  return (
    <HabitProvider>
      <div className="dashboard-outer">
        <div className="dashboard-frame">
          <TopNav />
          <Outlet />
        </div>
      </div>
    </HabitProvider>
  );
}
