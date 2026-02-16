import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Switch, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  Divider, 
  Button, 
  TextField
} from '@mui/material';
import { Save, Bell, Shield, Globe } from 'lucide-react';
import { toast } from 'react-toastify';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminSettingsPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSave = () => {
        toast.success('Settings saved successfully');
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="600">
                    Settings
                </Typography>
                <Button variant="contained" startIcon={<Save size={18} />} onClick={handleSave}>
                    Save Changes
                </Button>
            </Box>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    indicatorColor="primary" 
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab icon={<Globe size={20} />} iconPosition="start" label="General" />
                    <Tab icon={<Bell size={20} />} iconPosition="start" label="Notifications" />
                    <Tab icon={<Shield size={20} />} iconPosition="start" label="Security" />
                </Tabs>
                
                {/* General Settings */}
                <TabPanel value={tabValue} index={0}>
                    <Typography variant="h6" gutterBottom>System Preferences</Typography>
                    <List>
                        <ListItem>
                            <ListItemText 
                                primary="Maintenance Mode" 
                                secondary="Prevents non-admin users from accessing the system" 
                            />
                            <ListItemSecondaryAction>
                                <Switch edge="end" />
                            </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText 
                                primary="Public Registration" 
                                secondary="Allow new users to register" 
                            />
                            <ListItemSecondaryAction>
                                <Switch edge="end" defaultChecked />
                            </ListItemSecondaryAction>
                        </ListItem>
                    </List>

                    <Box mt={3}>
                        <Typography variant="h6" gutterBottom>Organization Info</Typography>
                        <Box display="flex" gap={2} flexDirection="column" maxWidth={600}>
                             <TextField label="Organization Name" defaultValue="CPMS System" fullWidth />
                             <TextField label="Support Email" defaultValue="support@cpms.com" fullWidth />
                        </Box>
                    </Box>
                </TabPanel>

                {/* Notifications */}
                <TabPanel value={tabValue} index={1}>
                     <Typography variant="h6" gutterBottom>Email Notifications</Typography>
                     <List>
                        <ListItem>
                            <ListItemText primary="New User Registration" secondary="Receive email when a new user registers" />
                            <ListItemSecondaryAction>
                                <Switch edge="end" defaultChecked />
                            </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText primary="System Alerts" secondary="Receive critical system health alerts" />
                            <ListItemSecondaryAction>
                                <Switch edge="end" defaultChecked />
                            </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText primary="Support Ticket Updates" secondary="Receive email on new support tickets" />
                            <ListItemSecondaryAction>
                                <Switch edge="end" defaultChecked />
                            </ListItemSecondaryAction>
                        </ListItem>
                     </List>
                </TabPanel>

                {/* Security */}
                <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" gutterBottom>Access Control</Typography>
                     <List>
                        <ListItem>
                            <ListItemText primary="Two-Factor Authentication (2FA)" secondary="Enforce 2FA for all admin accounts" />
                            <ListItemSecondaryAction>
                                <Switch edge="end" />
                            </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                         <ListItem>
                            <ListItemText primary="Session Timeout" secondary="Automatically log out inactive users" />
                            <Box sx={{ width: 100 }}>
                                <TextField 
                                    type="number" 
                                    label="Minutes" 
                                    size="small" 
                                    defaultValue={30} 
                                />
                            </Box>
                        </ListItem>
                     </List>
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default AdminSettingsPage;
