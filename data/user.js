import bcrypt from 'bcrypt';

const users = [
    {
        name: 'Admin User',
        email: 'admin@mail.com',
        password: bcrypt.hashSync('P@ss1234', 12),
        active: true,
        isAdmin: true,
    },
];

export default users;
