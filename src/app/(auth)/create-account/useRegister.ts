import { Dispatch, useContext, useState } from 'react';
import { LoginType, registerSchema, RegisterType } from '../validation/auth';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import {
  FetchResult,
  MutationFunctionOptions,
  useMutation,
} from '@apollo/client';
import { AUTH_SOCIAL_USER, REGISTER_USER } from '@/queries/auth';
import { IUserAuth } from '@/interfaces/user.interface';
import { showErrorToast } from '@/utils/utils';
import { DispatchProps, MonitorContext } from '@/context/MonitorContext';
import {
  Auth,
  FacebookAuthProvider,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import firebaseApp from '../firebase';

export const useRegister = (): IUserAuth => {
  const { dispatch } = useContext(MonitorContext);
  const [validationErrors, setValidationErrors] = useState<
    RegisterType | LoginType
  >({
    username: '',
    password: '',
    email: '',
  });
  const router: AppRouterInstance = useRouter();
  const [registerUser, { loading }] = useMutation(REGISTER_USER);

  const onRegisterSubmit = async (formData: FormData): Promise<void> => {
    const resultSchema = registerSchema.safeParse(Object.fromEntries(formData));
    if (!resultSchema.success) {
      setValidationErrors({
        username: resultSchema.error.format().username?._errors[0],
        email: resultSchema.error.format().email?._errors[0] ?? '',
        password: resultSchema.error.format().password?._errors[0],
      });
    } else {
      submitUserData(resultSchema.data, registerUser, dispatch, router);
    }
  };
  return {
    loading,
    validationErrors,
    setValidationErrors,
    onRegisterSubmit,
  };
};

export const useSocialRegister = (): IUserAuth => {
  const { dispatch } = useContext(MonitorContext);
  const router: AppRouterInstance = useRouter();
  const [authSocialUser, { loading }] = useMutation(AUTH_SOCIAL_USER);

  const registerWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const auth: Auth = getAuth(firebaseApp);
    auth.useDeviceLanguage();
    const userCredential: UserCredential = await signInWithPopup(
      auth,
      provider
    );
    const nameList = userCredential.user.displayName!.split(' ');
    const data = {
      username: nameList[0],
      email: userCredential.user.email,
      socialId: userCredential.user.uid,
      type: 'google',
    } as RegisterType;
    submitUserData(data, authSocialUser, dispatch, router);
  };

  const registerWithFacebook = async (): Promise<void> => {
    const provider = new FacebookAuthProvider();
    const auth: Auth = getAuth(firebaseApp);
    auth.useDeviceLanguage();
    const userCredential: UserCredential = await signInWithPopup(
      auth,
      provider
    );
    console.log(userCredential);
    const nameList = userCredential.user.displayName!.split(' ');
    const data = {
      username: nameList[0],
      email: userCredential.user.email,
      socialId: userCredential.user.uid,
      type: 'facebook',
    } as RegisterType;
    submitUserData(data, authSocialUser, dispatch, router);
  };
  return {
    loading,
    authWithGoogle: registerWithGoogle,
    authWithFacebook: registerWithFacebook,
  };
};

async function submitUserData(
  data: RegisterType,
  registerUserMethod: (
    options?: MutationFunctionOptions | undefined
  ) => Promise<FetchResult>,
  dispatch: Dispatch<DispatchProps>,
  router: AppRouterInstance
) {
  try {
    const result: FetchResult = await registerUserMethod({
      variables: {
        user: data,
      },
    });
    if (result && result.data) {
      const { registerUser, authSocialUser } = result.data;
      dispatch({
        type: 'dataUpdate',
        payload: {
          user: registerUser ? registerUser.user : authSocialUser.user,
          notifications: registerUser
            ? registerUser.notifiations
            : authSocialUser.notifiations,
        },
      });
      router.push('/status');
    }
  } catch (error) {
    console.log(error);
    showErrorToast('Invalid credentials');
  }
}
