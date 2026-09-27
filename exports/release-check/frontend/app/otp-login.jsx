'use client';
import { SignIn, SignUp } from '@clerk/nextjs';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAccount } from './auth-provider';
export default function OtpLogin({ signup = false, onDemo }) {
    const { configured, loaded } = useAccount();
    return <main className="container auth-wrap"><div className="auth-intro"><span className="intro-kicker"><ShieldCheck size={16}/> YOUR PERSONAL WORKSPACE</span><h1>One code.<br />Your next step.</h1><p>Sign in with an email code or Google to see your projects, feedback, and exactly how much work is left.</p></div><div className="auth-provider-panel">{configured ? (!loaded ? <p role="status">Loading secure sign-in…</p> : signup ? <SignUp routing="hash" signInUrl="/login" forceRedirectUrl="/dashboard"/> : <SignIn routing="hash" signUpUrl="/signup" forceRedirectUrl="/dashboard"/>) : <div className="panel form-panel"><h2>Welcome to SamkovAI</h2><p>Live sign-in is not connected yet. Explore the preview workspace while your account service is being set up.</p><button type="button" className="text-link" onClick={onDemo}>Explore demo workspace <ArrowRight size={16}/></button></div>}</div></main>;
}
