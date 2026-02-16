import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Car, 
  Trash2, 
  Plus, 
  AlertCircle,
  CheckCircle2,
  Info,
  X
} from 'lucide-react';
import { api } from '@utils/services/api';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@app/appReducer';
import Notification, { NotificationType } from '@shared/components/legacy/Notification';

const VehiclesPage: React.FC = () => {
  const theme = useTheme();
  // const { user } = useSelector((state: IRootState) => state.app.auth);
  const dispatch = useDispatch();
  const { user } = useSelector((state: IRootState) => state.app.auth); // Access user to update it
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // For custom confirmation
  const [newVehicle, setNewVehicle] = useState({ number: '', type: 'Four-wheeler', make_model: '', color: '' });
  const [error, setError] = useState<string | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{ message: string, type: NotificationType } | null>(null);

  // Fetch Vehicle on Load
  React.useEffect(() => {
    loadVehicle();
  }, []);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const data = await api.fetchVehicle();
      // If data is empty object or null, vehicle is null
      if (data && data.vehicle_number) {
        setVehicle(data);
      } else {
        setVehicle(null);
      }
    } catch (err) {
      console.error('Failed to load vehicle', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.number.trim()) {
      setError('Vehicle number is required');
      return;
    }

    try {
      await api.registerVehicle({
        number: newVehicle.number,
        type: newVehicle.type,
        make_model: newVehicle.make_model,
        color: newVehicle.color
      });
      
      await loadVehicle();
      // Update Redux state with new vehicle info
      if (user) {
        dispatch({
          type: 'AUTH/RECEIVE_USER_DATA',
          data: {
            ...user,
            vehicle_number: newVehicle.number,
            vehicle_type: newVehicle.type,
            vehicle_make_model: newVehicle.make_model,
            vehicle_color: newVehicle.color
          }
        });
      }

      setShowAddModal(false);
      setNewVehicle({ number: '', type: 'Four-wheeler', make_model: '', color: '' });
      setError(null);
      setNotification({ message: 'Vehicle added successfully!', type: 'success' });
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle');
      setNotification({ message: 'Failed to add vehicle', type: 'error' });
    }
  };

  // Trigger modal instead of confirm()
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.deleteVehicle();
      setVehicle(null);
      // Clear vehicle from Redux state
      if (user) {
        dispatch({
          type: 'AUTH/RECEIVE_USER_DATA',
          data: {
            ...user,
            vehicle_number: undefined,
            vehicle_type: undefined,
            vehicle_make_model: undefined,
            vehicle_color: undefined
          }
        });
      }
      setShowDeleteModal(false);
      setNotification({ message: 'Vehicle removed successfully', type: 'info' });
    } catch (err) {
      setNotification({ message: 'Failed to delete vehicle', type: 'error' });
    }
  };

  const handleEditClick = () => {
    setNewVehicle({
      number: vehicle.vehicle_number || '',
      type: vehicle.vehicle_type || 'Four-wheeler',
      make_model: vehicle.vehicle_make_model || '',
      color: vehicle.vehicle_color || ''
    });
    setShowAddModal(true);
  };

  return (
    <>
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
      
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2.5rem' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 800, 
              color: theme.palette.text.primary, 
              marginBottom: '0.5rem',
              letterSpacing: '-0.025em'
            }}>My Vehicles</h1>
            <p style={{ color: theme.palette.text.secondary }}>Manage your registered vehicles for campus parking.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: theme.palette.mode === 'light' ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
            }}
            className="add-btn"
          >
            <Plus size={20} />
            Add Vehicle
          </button>
        </header>

        {loading ? <p>Loading...</p> : !vehicle ? (
          <div style={{  
            backgroundColor: theme.palette.background.paper,
            padding: '4rem 2rem',
            borderRadius: '24px',
            textAlign: 'center',
            border: `2px dashed ${theme.palette.divider}`
          }}>
            <div style={{ 
              backgroundColor: `${theme.palette.primary.main}10`,
              color: theme.palette.primary.main,
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <Car size={40} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, marginBottom: '1rem' }}>No Vehicles Registered</h2>
            <p style={{ color: theme.palette.text.secondary, maxWidth: '400px', margin: '0 auto 2rem' }}>
              You haven't added any vehicles to your profile yet. Add a vehicle to start applying for parking permits.
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                border: 'none',
                padding: '0.875rem 2rem',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Get Started
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <div style={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: '24px',
              padding: '2rem',
              position: 'relative',
              boxShadow: theme.palette.mode === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
              border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                padding: '1.5rem' 
              }}>
                <div style={{
                  backgroundColor: theme.palette.success.main + '15',
                  color: theme.palette.success.main,
                  padding: '0.375rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <CheckCircle2 size={14} />
                  PRIMARY
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{
                  backgroundColor: theme.palette.primary.main + '10',
                  color: theme.palette.primary.main,
                  padding: '1.25rem',
                  borderRadius: '18px'
                }}>
                  <Car size={32} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>Vehicle Number</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '0.05em' }}>{vehicle.vehicle_number}</div>
                  <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginTop: '0.5rem' }}>{vehicle.vehicle_type}</div>
                   {vehicle.vehicle_make_model && <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>{vehicle.vehicle_make_model} - {vehicle.vehicle_color}</div>}
                </div>
              </div>

              <div style={{ 
                marginTop: '2rem', 
                paddingTop: '1.5rem', 
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: theme.palette.text.secondary,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }} className="hover-link" onClick={handleEditClick}>
                    Edit Details
                  </button>
                </div>
                <button 
                  onClick={handleDeleteClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.palette.error.main,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }} className="hover-danger">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div style={{
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : '#1e1e2d',
              borderRadius: '24px',
              padding: '2rem',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <Info size={32} color="rgba(255,255,255,0.7)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Important Note</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>
                You can only have one primary vehicle registered for an active parking permit. If you change your vehicle, make sure to update your permit details at the security office.
              </p>
            </div>
          </div>
        )}

        {/* Add Vehicle Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}>
            <div style={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: '24px',
              width: '100%',
              maxWidth: '450px',
              padding: '2.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                   <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.palette.text.primary, marginBottom: '0.5rem' }}>{vehicle ? 'Edit Vehicle Details' : 'Add New Vehicle'}</h2>
              <p style={{ color: theme.palette.text.secondary, marginBottom: '2rem' }}>{vehicle ? 'Update your vehicle information below.' : 'Enter your vehicle details below.'}</p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary,
                  marginBottom: '0.5rem' 
                }}>Vehicle Number</label>
                <input 
                  type="text" 
                  value={newVehicle.number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })}
                  placeholder="e.g. ABC-1234"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                />
                {error && <div style={{ color: theme.palette.error.main, fontSize: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={14} /> {error}
                </div>}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: theme.palette.text.secondary, marginBottom: '0.5rem' }}>Make & Model</label>
                <input 
                  type="text" 
                  value={newVehicle.make_model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make_model: e.target.value })}
                  placeholder="e.g. Tesla Model 3"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: theme.palette.text.secondary, marginBottom: '0.5rem' }}>Color</label>
                <input 
                  type="text" 
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                  placeholder="e.g. Silver"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary,
                  marginBottom: '0.5rem' 
                }}>Vehicle Type</label>
                <select 
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                >
                  <option value="Four-wheeler">Four-wheeler (Car/SUV)</option>
                  <option value="Two-wheeler">Two-wheeler (Bike/Scooter)</option>
                  <option value="Electric">Electric Vehicle</option>
                  <option value="Bicycle">Bicycle</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    border: `1.5px solid ${theme.palette.divider}`,
                    padding: '1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddVehicle}
                  style={{
                    flex: 1,
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >

                  {vehicle ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}>
            <div style={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: '24px',
              width: '100%',
              maxWidth: '400px',
              padding: '2.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: theme.palette.error.main + '20',
                color: theme.palette.error.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Trash2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.palette.text.primary, marginBottom: '1rem' }}>Remove Vehicle?</h2>
              <p style={{ color: theme.palette.text.secondary, marginBottom: '2rem', lineHeight: 1.5 }}>
                Are you sure you want to remove vehicle <strong>{vehicle?.vehicle_number}</strong>? <br/>This action cannot be undone.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    border: `1.5px solid ${theme.palette.divider}`,
                    padding: '1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1,
                    backgroundColor: theme.palette.error.main,
                    color: 'white',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .add-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .hover-link:hover { color: ${theme.palette.primary.main} !important; }
        .hover-danger:hover { background-color: ${theme.palette.error.main}10 !important; }
      `}</style>
    </>
  );
};

export default VehiclesPage;
