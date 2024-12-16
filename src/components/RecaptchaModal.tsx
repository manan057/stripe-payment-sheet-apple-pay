import React, { useEffect, useRef } from 'react';
import Recaptcha, { RecaptchaRef } from 'react-native-recaptcha-that-works';

const _ReCaptchaModal = ({
  show,
  baseUrl,
  onClose,
  recaptchaSiteKey,
  onCaptchaError,
  onCaptchaSuccess,
}: {
  show: boolean;
  baseUrl: string;
  onClose: () => void;
  recaptchaSiteKey: string;
  onCaptchaSuccess: (token: string) => void;
  onCaptchaError: (msg: string) => void;
}) => {

  const recaptcha = useRef<RecaptchaRef>(null);

  const onExpire = () => {
    console.warn('Captcha expired');
    onCaptchaError('The captcha expired, please try again');
  };

  const onError = () => {
    console.warn('Captcha errored');
    onCaptchaError('An error occured regarding captcha, please try again');
  };

  const onVerify = (token: string) => {
    console.log('success!', token);
    onCaptchaSuccess(token);
  };

  useEffect(() => {
    if (show) {
      console.log('Sent!!!');
      recaptcha.current?.open();
    }
  }, [show]);

  return (
    <Recaptcha
      ref={recaptcha}
      siteKey={recaptchaSiteKey}
      baseUrl={baseUrl}
      onVerify={onVerify}
      onExpire={onExpire}
      onError={onError}
      hideBadge
      onClose={onClose}
      size="invisible"
      loadingComponent={null}
    />
  );
};

export default _ReCaptchaModal;
