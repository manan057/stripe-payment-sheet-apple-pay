import React, { useState } from 'react';
import { TouchableOpacity, View, Text, Alert } from 'react-native';
import ReCaptchaModal from './RecaptchaModal';
import { handleActionRequired, handleCreditCard, handlePlatformPay } from '../utils/handleStripe';
import { PaymentType } from '@stripe/stripe-react-native/lib/typescript/src/types/PlatformPay';

export type paymentGatewayConfig = {
    clientConnectKey: string;
    clientKey: string;
    data: any;
    environment: string;
    merchantAccount: string;
    publicEncryptionKey: string;
    version: string;
}

export type merchantConfig = {
    merchantId: string;
    merchantName?: string | undefined;

}

export enum PAYMENT_METHOD {
    MEMBER_MONEY = 'member-money',
    MEMBER_POINTS = 'member-points',
    MEMBER_REWARDS = 'member-rewards',
    EFTPOS = 'eftpos',
    GIFT_CARD = 'gift-card',
    CREDIT_CARD = 'credit-card',
    SAVED_CARD = 'saved-card',
    APPLE_PAY = 'apple-pay',
    GOOGLE_PAY = 'google-pay',
    ALIPAY = 'alipay',
    FREE = 'free',
    PAY_LATER = 'pay-at-till',
}
  

export const PaymentButton = () => {
    // due to the async nature of the handlePlatformPay function, we need to store the reCaptcha token in react state
    const [reCaptchaToken, setReCaptchaToken] = useState<null | string>(null);
    const [showCaptchaModal, setShowCaptchaModal] = useState(false);
    const [onCaptchaModalDismiss, setOnCaptchModalDismiss] = useState<any>(null);

    // Test data 
    const paymentMethod: string = 'apple-pay';
    const merchantConfig: merchantConfig = {
        merchantId: '',
        merchantName: '',
    }
    const currencyCode = 'aud';
    const paymentCountryCode = 'AU';
    const paymentGatewayConfig: paymentGatewayConfig = {
        clientConnectKey: '',
        clientKey: '',
        data: { paymentMethods: [] },
        environment: 'test',
        merchantAccount: '',
        publicEncryptionKey: 'undefined',
        version: '',
    }
  
    const hideCaptchaModal = ({ then }: { then?: () => void }) => {
      setShowCaptchaModal(false);
      setOnCaptchModalDismiss(then);
    };
  
    const handleCheckout = async (recaptchaToken: string | null = null) => {
  
        switch (paymentMethod) {
            case 'credit-card': {
                const { token, lastFour } = await handleCreditCard(
                    {
                        "effective": {"email": "appdemo@redcat.com.au", "familyName": "Mink", "mobile": "+61422711596", "name": "Patsy"}, 
                        "email": null, 
                        "familyName": null, 
                        "mobile": null, 
                        "name": null
                    },
                    true,
                ); 

                // subPayment.token = token;
                // subPayment.lastFour = lastFour;
                break;
            }
            case 'apple-pay': {
                try {
                    console.log('handlePlatformPay try APPLE PAY');

                    const { token } = await handlePlatformPay({
                    // @ts-ignore
                    applePayItems: [ 
                        // @ts-ignore
                        {
                            label: 'TopUp',
                            amount: '1',
                        }
                    ],
                    paymentGatewayConfig: paymentGatewayConfig!,
                    merchantConfig,
                    currencyCode,
                    paymentCountryCode,
                    });
                    
                    // subPayment.token = token;
                    console.log('handlePlatformPay try APPLE PAY success', token);

                } catch (error) {
                    console.log('handlePlatformPay error:', error);
                    console.log('handlePlatformPay try APPLE PAY error');
                }
                break;
                }
            case 'google-pay': {
                const { token } = await handlePlatformPay({
                    paymentGatewayConfig: paymentGatewayConfig!,
                    merchantConfig,
                    googlePayAmount: 100,
                    currencyCode,
                    paymentCountryCode,
                });

                // subPayment.token = token;
                break;
            }
            default:
        }

  
        //   if (subPayment) {
        //     //update payment method with token details
        //     dispatch(updateSelectedPaymentMethod(subPayment));
        //   }
    
    
        //process sale
        //   const response = await dispatch(
        //     sale({
        //       route: topUpMode ? 'topup' : 'checkout',
        //       authenticationMethod: member ? 'member' : 'none',
        //       token: recaptchaToken,
        //     }),
        //   );
    
        //   const { payload }: any = response;
  
        // if (response.meta.requestStatus === 'fulfilled') {
        //     if (payload?.success) {
        //         if (payment_gateway?.method === PAYMENT_METHOD.APPLE_PAY) {
        //             // close apple pay window
        //             await confirmPlatformPayPayment(
        //             payload.data.paymentData.payment_intent_client_secret,
        //             {},
        //             );
        //         }
  
        //     //   if (topUpMode) {
        //     //     topUpSuccessful();
        //     //   } else {
        //     //     // checkout complete
        //     //     checkoutSuccessfull();
        //     //   }
        //     checkoutSuccessfull();

        // } else {
        //   //3ds
        //   if (payload?.error_code === 206) {
        //     handle3ds(payload.additional_info);
        //   }
        // }
    //   } else {
    //     //handle checkout errors
    //     Alert.alert('error', payload.error);
    //   }
    };
  
    const handle3ds = async (additional_info: any) => {
      const { success, data } = await handleActionRequired({
        additional_info,
        paymentGatewayConfig: paymentGatewayConfig!,
        paymentGatewayMethod: paymentMethod,
        merchantConfig,
      });
  
      if (success) {
        checkoutSuccessfull();
      }
    };
  
    const checkoutSuccessfull = () => {
        Alert.alert('checkoutSuccessful');
    };
  
    const handlePayNow = async () => {
        if (!showCaptchaModal && reCaptchaToken === null) {
            setShowCaptchaModal(true);
        } else {
            // we have to pass in the token here because the modal is already open
            showCaptchaModal
            ? hideCaptchaModal({
                then: async() =>  handleCheckout(reCaptchaToken),
            })
            :  handleCheckout(reCaptchaToken);
        }
    };

    
    return (
        <View>
            {showCaptchaModal && (
                <ReCaptchaModal
                baseUrl={''}
                recaptchaSiteKey={''}
                onCaptchaError={(message: string) => {
                    setReCaptchaToken(null);
                    setShowCaptchaModal(false);

                    console.log('====> onCaptchaError', message);
                }}
                onCaptchaSuccess={async (token: string) => {
                    await handleCheckout(token);
                    console.log('====> onCaptchaSuccess', 'await handleCheckout(token)');
                    // store the token in redux state so that it can be used in handleCheckout
                    setReCaptchaToken(token);        
                    setShowCaptchaModal(false);
                    console.log('====> onCaptchaSuccess', 'setStates');
                }}
                onClose={async() => {
                    console.log('====> onCaptcha Close', 'stuff');
                    setReCaptchaToken(null);
                    setShowCaptchaModal(false);
                }}
                show={showCaptchaModal}
                    />
            )}

            <TouchableOpacity onPress={() => handlePayNow()}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Pay Now</Text>
            </TouchableOpacity>
        </View>
    );
};
