import React, { useState, useEffect } from 'react';
import type { Student } from '../utils/pco';
import type { Address } from '../utils/hygiene';
import { fixPhone, fixAddress } from '../utils/hygiene';
import './LocusPublic.css';

interface LocusPublicProps {
  students: Student[];
  onSave: (student: Student) => void;
}

export const LocusPublic: React.FC<LocusPublicProps> = ({ students, onSave }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Flattening state for inputs
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      phoneNumber: '',
      street: '',
      city: '',
      state: '',
      zip: ''
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        name: selectedStudent.name || '',
        email: selectedStudent.email || '',
        phoneNumber: selectedStudent.phoneNumber || '',
        street: selectedStudent.address?.street || '',
        city: selectedStudent.address?.city || '',
        state: selectedStudent.address?.state || '',
        zip: selectedStudent.address?.zip || '',
      });
      setSaveSuccess(false);
    } else {
      setFormData({
        name: '', email: '', phoneNumber: '', street: '', city: '', state: '', zip: ''
      });
    }
  }, [selectedStudent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    if (!selectedStudent) return;

    let updatedPhone = formData.phoneNumber || '';
    let updatedStreet = formData.street || '';

    // Apply hygiene
    if (updatedPhone) updatedPhone = fixPhone(updatedPhone);
    if (updatedStreet) updatedStreet = fixAddress(updatedStreet);

    const updatedAddress: Address | null = (updatedStreet || formData.city || formData.state || formData.zip) ? {
        street: updatedStreet,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
    } : null;

    const updatedStudent: Student = {
      ...selectedStudent,
      name: formData.name || selectedStudent.name,
      email: formData.email || null,
      phoneNumber: updatedPhone || null,
      address: updatedAddress,
    };

    onSave(updatedStudent);

    setFormData(prev => ({
      ...prev,
      phoneNumber: updatedPhone,
      street: updatedStreet
    }));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="locus-public-container">
      <div className="locus-public-header">
        <h2>Locus Public (Member Portal)</h2>
        <p>A self-service portal for members to update their own contact information.</p>
      </div>

      <div className="locus-public-login">
        <label htmlFor="member-select">Simulate Login As:</label>
        <select
          id="member-select"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          <option value="">-- Select a Member --</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      {selectedStudent && (
        <div className="locus-public-profile">
          <h3>My Profile</h3>

          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleChange}
              placeholder="(555) 555-5555"
            />
          </div>

          <div className="form-group">
            <label>Home Address</label>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street || ''}
                  onChange={handleChange}
                  placeholder="Street"
                />
                <div style={{display: 'flex', gap: '0.5rem'}}>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleChange}
                      placeholder="City"
                      style={{flex: 2}}
                    />
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state || ''}
                      onChange={handleChange}
                      placeholder="State"
                      style={{flex: 1}}
                    />
                    <input
                      type="text"
                      id="zip"
                      name="zip"
                      value={formData.zip || ''}
                      onChange={handleChange}
                      placeholder="Zip"
                      style={{flex: 1}}
                    />
                </div>
            </div>
          </div>

          <button className="update-btn" onClick={handleUpdate}>
            Update Profile
          </button>

          {saveSuccess && <span className="success-msg">Profile updated successfully! Points earned!</span>}
        </div>
      )}
    </div>
  );
};
