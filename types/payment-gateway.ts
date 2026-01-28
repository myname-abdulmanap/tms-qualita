export interface PaymentGatewayConfig {
  id?: string;
  code: string;
  name: string;
  baseUrl: string;

  createOrderPath: string;
  method: string;
  headersTemplate: any;
  bodyTemplate: any;
  responseMapping: any;

  webhookPath: string;
  webhookEventField: string;
  webhookSuccessEvent: string;
  webhookDataField: string;
  webhookOrderIdField: string;
  webhookStatusField: string;
  webhookSuccessStatus: string;
  webhookSignatureHeader?: string;
  webhookSecret?: string;
  webhookSignatureAlgo?: string;

  isActive?: boolean;
  createdAt?: string;
}
