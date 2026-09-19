'use client';
import {createContext,useContext,useMemo,ReactNode} from 'react';
import {ClerkProvider,useAuth,useClerk,useUser} from '@clerk/nextjs';
type Account={configured:boolean;loaded:boolean;user:{id:string;email?:string;user_metadata:{full_name:string}}|null;getToken:()=>Promise<string|null>;signOut:()=>Promise<void>};
const preview:Account={configured:false,loaded:true,user:null,getToken:async()=>null,signOut:async()=>{}};
const AccountContext=createContext<Account>(preview);
export const useAccount=()=>useContext(AccountContext);
function ConnectedAccount({children}:{children:ReactNode}){
 const {user,isLoaded}=useUser();const {getToken}=useAuth();const {signOut}=useClerk();
 const student=useMemo(()=>user?{id:user.id,email:user.primaryEmailAddress?.emailAddress,user_metadata:{full_name:user.fullName||user.firstName||''}}:null,[user]);
 return <AccountContext.Provider value={{configured:true,loaded:isLoaded,user:student,getToken:()=>getToken(),signOut:async()=>{await signOut()}}}>{children}</AccountContext.Provider>
}
export default function AccountProvider({children}:{children:ReactNode}){
 const key=process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
 if(!key)return <AccountContext.Provider value={preview}>{children}</AccountContext.Provider>;
 return <ClerkProvider appearance={{variables:{colorBackground:"var(--surface-alt)",colorText:"var(--ink)",colorTextSecondary:"var(--muted)",colorInputBackground:"var(--surface)",colorInputText:"var(--ink)",colorPrimary:"#526beb"}}} publishableKey={key} signInUrl="/login" signUpUrl="/signup" signInForceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard"><ConnectedAccount>{children}</ConnectedAccount></ClerkProvider>
}
