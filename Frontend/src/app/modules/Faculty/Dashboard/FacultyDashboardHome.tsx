import React from 'react';
import DashboardHub from '@modules/Shared/Dashboard/DashboardHub';
import HealthWidget from '@modules/Shared/Dashboard/widgets/HealthWidget';
import ZoneOccupancyWidget from '@modules/Shared/Dashboard/widgets/ZoneOccupancyWidget';
import QuickProfileWidget from '@modules/Shared/Dashboard/widgets/QuickProfileWidget';
import PermissionGuard from '@shared/components/PermissionGuard';

const FacultyDashboardHome: React.FC = () => {
  return (
    <DashboardHub 
      title="Welcome Back, Faculty Member!" 
      subtitle="Priority parking status and system operational awareness."
      widgets={[
        <QuickProfileWidget key="profile" />,
        <PermissionGuard key="zones-guard" permission="zones.faculty.view">
            <ZoneOccupancyWidget />
        </PermissionGuard>,
        <PermissionGuard key="health-guard" permission="system.health.view">
            <HealthWidget />
        </PermissionGuard>
      ]}
    />
  );
};

export default FacultyDashboardHome;
