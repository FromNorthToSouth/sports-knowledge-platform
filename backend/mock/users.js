// 临时用户数据存储（内存中）
const tempUsers = [
  {
    _id: 'admin001',
    username: 'admin',
    email: 'admin@example.com',
    password: '21232f297a57a5a743894a0e4a801fc3', // admin的MD5
    name: '系统管理员',
    role: 'admin',
    institution: '507f1f77bcf86cd799439011',
    createdAt: new Date(),
    isActive: true
  },
  {
    _id: 'teacher001',
    username: 'teacher1',
    email: 'teacher@example.com',
    password: 'a426dcf72ba25d046591f81a5495eab7', // teacher123的MD5
    name: '张老师',
    role: 'teacher',
    institution: '507f1f77bcf86cd799439011',
    createdAt: new Date(),
    isActive: true
  },
  {
    _id: 'student001',
    username: 'student1',
    email: 'student@example.com',
    password: 'ad6a280417a0f533d8b670c61667e1a0', // student123的MD5
    name: '李同学',
    role: 'student',
    institution: '507f1f77bcf86cd799439011',
    createdAt: new Date(),
    isActive: true
  }
];

module.exports = {
  tempUsers
};