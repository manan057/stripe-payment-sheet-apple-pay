import {
    initStripe,
    handleNextAction,
    createToken,
    createPaymentMethod,
    createPlatformPayPaymentMethod,
    PlatformPay,
    PlatformPayError,
  } from '@stripe/stripe-react-native';
  
  import { Alert } from 'react-native';
  
  export const handleCreditCard = async (
    { name, familyName, email, mobile }: any,
    enableDynamicPaymentGatewayConfig: boolean,
  ) => {
    const fullName = `Te St`.trim();
  
    if (enableDynamicPaymentGatewayConfig) {
      return createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: fullName,
            email: undefined,
            phone: undefined,
          },
        },
      }).then(({ paymentMethod, error }) => {
        if (error) {
          console.warn('error in dynamic cc payment hook', { error });
          Alert.alert(error.code, error.localizedMessage);
          throw error;
        }
  
        return {
          token: paymentMethod?.id,
          lastFour: paymentMethod?.Card?.last4,
        };
      });
    } else {
      return createToken({
        name: fullName,
        type: 'Card',
      }).then(result => {
        if (result.error) {
          console.error('error in cc payment hook', result.error);
          throw new Error(result.error.message);
        }
  
        return {
          token: result.token?.id,
          lastFour: result.token?.card?.last4,
        };
      });
    }
  };
  
  export const handleActionRequired = async ({
    additional_info,
    paymentGatewayConfig,
    paymentGatewayMethod,
    merchantConfig,
  }: {
    additional_info: any;
    paymentGatewayConfig: {
      clientKey: string;
      merchantAccount: string;
    };
    paymentGatewayMethod: 'CREDIT_CARD' | 'SAVED_CARD' | string;
    merchantConfig: {
      merchantId: string;
    };
  }) => {
    const { action, orderInfo } = additional_info;

    return initStripe({
      publishableKey: paymentGatewayConfig.clientKey,
      stripeAccountId: paymentGatewayConfig.merchantAccount,
      merchantIdentifier: merchantConfig.merchantId,
    })
      .then(async () => {
        switch (paymentGatewayMethod) {
          case 'credit-card':
          case 'saved-card':
            return await handleNextAction(action.client_secret);
          default:
            throw new Error('unsupported payment method for handleActionRequired');
        }
      })
      .then(result => {
        if (result.error) {
          throw result.error;
        }
  
        return {
          success: true,
          data: {
            orderInfo: orderInfo,
            actionResponse: {
              payment_intent_id: result.paymentIntent.id,
            },
          },
        };
      })
      .catch(error => {
  
        Alert.alert('error', 'Problem finalising order');
  
        return {
          success: false,
          error,
          data: {},
        };
      });
  };
  
  export const handlePlatformPay = async ({
    paymentGatewayConfig,
    merchantConfig,
    currencyCode,
    paymentCountryCode,
    applePayItems = [],
    googlePayAmount,
  }: {
    paymentGatewayConfig: {
      clientKey: string;
      merchantAccount: string;
      environment: string;
    };
    merchantConfig: {
      merchantId: string;
    };
    currencyCode: string;
    paymentCountryCode: string;
    applePayItems?: PlatformPay.ImmediateCartSummaryItem[];
    googlePayAmount?: number;
  }) => {
    const testMode = paymentGatewayConfig.environment !== 'live';
  
    // In polygon ordering the getApplePayItems doesn't include paymentType: "Immediate"
    // This is needed for stripe-react-native.
    const parsedApplePayItems: PlatformPay.ImmediateCartSummaryItem[] = applePayItems.map(obj => ({
      ...obj,
      paymentType: PlatformPay.PaymentType.Immediate,
    }));
  
    return initStripe({
      publishableKey: paymentGatewayConfig.clientKey,
      stripeAccountId: paymentGatewayConfig.merchantAccount,
      merchantIdentifier: merchantConfig.merchantId,
    })
      .then(() =>
        {
            console.log('==> Inside handlePlatformPay', 'waiting for initStripe');
            return createPlatformPayPaymentMethod({
                applePay: {
                  cartItems: parsedApplePayItems,
                  currencyCode: currencyCode,
                  merchantCountryCode: paymentCountryCode,
                },
                googlePay: {
                  merchantCountryCode: paymentCountryCode,
                  currencyCode: currencyCode,
                  merchantName: merchantConfig.merchantId!,
                  testEnv: testMode,
                  amount: googlePayAmount,
                },
              }).then((result) => {
                console.log('==> Inside createPlatformPayPaymentMethod then', result);
                return result;
              }).catch(error => {
                console.log('==> Inside createPlatformPayPaymentMethod catch', error);
              })
        }
      )
      .then((result) => {
        console.log('==> Inside then: find result', result);
        const { paymentMethod, error } = result;
        if (error) {
          if (error.code !== PlatformPayError.Canceled) {
            console.error('error in dynamic platform (Apple Pay / Google Pay) payment hook', {
              error,
            });
          }
          throw error;
        }
  
        return {
          token: paymentMethod?.id,
        };
      });
  };
  