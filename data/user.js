import bcrypt from 'bcrypt';

const users = [
    {
        name: 'Admin User',
        email: 'admin@mail.com',
        password: bcrypt.hashSync('P@ss1234', 12),
        emailVerifiedAt: '2025-01-01 00:00:00',
        active: true,
        isAdmin: true,
    },
    {
        name: 'Staff One',
        email: 'staff1@mail.com',
        password: bcrypt.hashSync('P@ss1234', 12),
        emailVerifiedAt: '2025-01-01 00:00:00',
        isActive: true,
        role: 'staff',
    }, {
        name: 'Staff Two',
        email: 'staff2@mail.com',
        password: bcrypt.hashSync('P@ss1234', 12),
        emailVerifiedAt: '2025-01-01 00:00:00',
        isActive: true,
        role: 'staff',
    },
];

export default users;
