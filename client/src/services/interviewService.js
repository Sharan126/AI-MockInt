import API from './api.js';

const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await API.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

const getResume = async () => {
  const response = await API.get('/resume');
  return response.data.data;
};

const startInterview = async (
  role,
  resumeText,
  totalQuestions = 5,
  companyTrack = 'General',
  interviewerPersona = 'Natalie',
  jobDescription = '',
  pressureMode = false,
  isSuperday = false
) => {
  const response = await API.post('/interview/start', {
    role,
    resumeText,
    totalQuestions,
    companyTrack,
    interviewerPersona,
    jobDescription,
    pressureMode,
    isSuperday,
  });
  return response.data.data;
};

const getInterview = async (id) => {
  const response = await API.get(`/interview/${id}`);
  return response.data.data;
};

const submitTextAnswer = async (interviewId, answer, candidateAudio = null) => {
  const response = await API.post(`/interview/${interviewId}/answer`, {
    answer,
    candidateAudio,
  });
  return response.data.data;
};

const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  const response = await API.post('/interview/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

const submitCode = async (interviewId, code, language) => {
  const response = await API.post(`/interview/${interviewId}/code`, { code, language });
  return response.data.data;
};

const endInterview = async (interviewId) => {
  const response = await API.post(`/interview/${interviewId}/end`);
  return response.data.data;
};

const auditWhiteboard = async (interviewId, whiteboardData) => {
  const response = await API.post(`/interview/${interviewId}/audit-whiteboard`, whiteboardData);
  return response.data.data;
};

const optimizeResume = async (resumeText, targetRole) => {
  const response = await API.post('/interview/optimize-resume', { resumeText, targetRole });
  return response.data.data;
};

const shareInterview = async (interviewId) => {
  const response = await API.post(`/interview/${interviewId}/share`);
  return response.data.data;
};

const getSharedInterview = async (token) => {
  const response = await API.get(`/interview/shared/${token}`);
  return response.data.data;
};

const updateGoal = async (goalData) => {
  const response = await API.post('/interview/goal', goalData);
  return response.data.data;
};

const clarifyQuestion = async (interviewId, questionText) => {
  const response = await API.post(`/interview/${interviewId}/clarify`, { questionText });
  return response.data.data;
};

const saveVisionMetrics = async (interviewId, metrics) => {
  const response = await API.post(`/interview/${interviewId}/vision`, metrics);
  return response.data.data;
};

const auditStarStory = async (storyData) => {
  const response = await API.post('/interview/star/audit', storyData);
  return response.data.data;
};

const getStarStories = async () => {
  const response = await API.get('/interview/star');
  return response.data.data;
};

const saveStarStory = async (storyData) => {
  const response = await API.post('/interview/star', storyData);
  return response.data.data;
};

const deleteStarStory = async (storyId) => {
  const response = await API.delete(`/interview/star/${storyId}`);
  return response.data.data;
};

const simulateNegotiation = async (negotiationData) => {
  const response = await API.post('/interview/negotiate', negotiationData);
  return response.data.data;
};

export {
  uploadResume,
  getResume,
  startInterview,
  getInterview,
  submitTextAnswer,
  transcribeAudio,
  submitCode,
  endInterview,
  auditWhiteboard,
  optimizeResume,
  shareInterview,
  getSharedInterview,
  updateGoal,
  clarifyQuestion,
  saveVisionMetrics,
  auditStarStory,
  getStarStories,
  saveStarStory,
  deleteStarStory,
  simulateNegotiation,
};
