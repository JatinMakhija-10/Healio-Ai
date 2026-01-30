/**
 * Healio.AI - Doctor Card Component
 */

const SAMPLE_DOCTORS = [
    {
        id: 1,
        name: 'Dr. Sarah Chen',
        specialty: 'Pain Management Specialist',
        availability: 'Available today',
        verified: true,
        avatar: null
    },
    {
        id: 2,
        name: 'Dr. Michael Roberts',
        specialty: 'Physical Medicine & Rehabilitation',
        availability: 'Available tomorrow',
        verified: true,
        avatar: null
    },
    {
        id: 3,
        name: 'Dr. Emily Thompson',
        specialty: 'Neurologist',
        availability: 'Available in 2 days',
        verified: true,
        avatar: null
    }
];

export function DoctorCard({ doctor }) {
    const { name, specialty, availability, verified } = doctor;

    return `
    <div class="doctor-card" data-doctor-id="${doctor.id}">
      <div class="doctor-card-avatar">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div class="doctor-card-info">
        <div class="doctor-card-name">
          ${name}
          ${verified ? `
            <svg class="doctor-card-verified" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          ` : ''}
        </div>
        <div class="doctor-card-specialty">${specialty}</div>
        <div class="doctor-card-availability">${availability}</div>
      </div>
    </div>
  `;
}

export function DoctorList() {
    return `
    <div class="doctor-list">
      <h3 class="frequency-title">Available Healthcare Providers</h3>
      <div class="frequency-options">
        ${SAMPLE_DOCTORS.map(doctor => DoctorCard({ doctor })).join('')}
      </div>
    </div>
  `;
}

export { SAMPLE_DOCTORS };
