import * as React from 'react';
import { Html, Head, Body, Container, Heading, Text, Button, Hr } from '@react-email/components';

interface DownEmailProps {
  monitorName: string;
  url: string;
  startedAt: Date;
  statusCode?: number;
  error?: string;
  monitorId: string;
  appUrl: string;
}

export function DownEmail({
  monitorName,
  url,
  startedAt,
  statusCode,
  error,
  monitorId,
  appUrl,
}: DownEmailProps) {
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
          <Heading style={{ color: '#e53e3e' }}>🔴 {monitorName} is down</Heading>
          <Text>Your monitor has detected an outage.</Text>
          <Hr />
          <Text>
            <strong>URL:</strong> {url}
          </Text>
          <Text>
            <strong>Incident started:</strong> {startedAt.toISOString()}
          </Text>
          {statusCode !== undefined && (
            <Text>
              <strong>Status code:</strong> {statusCode}
            </Text>
          )}
          {error && (
            <Text>
              <strong>Error:</strong> {error}
            </Text>
          )}
          <Hr />
          <Button
            href={`${appUrl}/monitors/${monitorId}`}
            style={{
              backgroundColor: '#3182ce',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            View Monitor
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export const downEmailSubject = (monitorName: string) => `Alert: ${monitorName} is down`;
