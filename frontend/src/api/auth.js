import api from './client'

export const signupCitizen  = (data)          => api.post('/auth/signup/citizen',   data)
export const signupNgo       = (data)          => api.post('/auth/signup/ngo',        data)
export const signupVolunteer = (data)          => api.post('/auth/signup/volunteer',  data)
export const signin          = (email, pass)   => api.post('/auth/signin',            { email, password: pass })
export const verifyOtp       = (email, code)   => api.post('/auth/verify-otp',        { email, code })
export const refreshToken    = (refresh_token) => api.post('/auth/refresh',           { refresh_token })
export const logout          = (access_token)  => api.post('/auth/logout',            { access_token })
export const resendOtp       = (email)         => api.post('/auth/resend-otp',        { email })
