import * as React from 'react';
import { Html, Head, Body, Container, Heading, Text, Hr } from '@react-email/components';

interface SslExpiryEmailProps {
  monitorName: string;
  url: string;
  daysRemaining: number;
  expiryDate: Date;
}

export function SslExpiryEmail({
  monitorName,
  url,
  daysRemaining,
  expiryDate,
}: SslExpiryEmailProps) {
  const isUrgent = daysRemaining < 7;
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9' }}>
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: '#ffffff',
          }}
        >
          <Heading style={{ color: isUrgent ? '#e53e3e' : '#d69e2e' }}>
            {isUrgent ? '🚨' : '⚠️'} SSL Certificate Expiring Soon
          </Heading>
          {isUrgent && (
            <Text style={{ color: '#e53e3e', fontWeight: 'bold' }}>
              URGENT: Your SSL certificate expires in less than 7 days!
            </Text>
          )}
          <Hr />
          <Text>
            <strong>Monitor:</strong> {monitorName}
          </Text>
          <Text>
            <strong>URL:</strong> {url}
          </Text>
          <Text>
            <strong>Days remaining:</strong> {daysRemaining}
          </Text>
          <Text>
            <strong>Expiry date:</strong> {expiryDate.toISOString()}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const sslExpiryEmailSubject = (daysRemaining: number, monitorName: string) =>
  `SSL expiring in ${daysRemaining} days — ${monitorName}`;
