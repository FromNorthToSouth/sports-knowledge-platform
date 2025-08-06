// Mock数据统一导出文件
const { tempUsers } = require('./users');
const { mockInstitutions } = require('./institutions');
const { mockKnowledgeBases } = require('./knowledgeBases');
const { mockLearningPaths, mockKnowledgePoints } = require('./learningPaths');
const { mockStats } = require('./stats');

module.exports = {
  tempUsers,
  mockInstitutions,
  mockKnowledgeBases,
  mockLearningPaths,
  mockKnowledgePoints,
  mockStats
}; 