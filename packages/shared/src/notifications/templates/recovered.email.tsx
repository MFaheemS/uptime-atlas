import * as React from 'react';
import { Html, Head, Body, Container, Heading, Text, Hr } from '@react-email/components';

interface RecoveredEmailProps {
  monitorName: string;
  url: string;
  startedAt: Date;
  recoveredAt: Date;
  durationMs: number;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} seconds`;
  return `${minutes} minutes ${seconds} seconds`;
}

export function RecoveredEmail({
  monitorName,
  url,
  startedAt,
  recoveredAt,
  durationMs,
}: RecoveredEmailProps) {
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
          <Heading style={{ color: '#38a169' }}>✅ {monitorName} has recovered</Heading>
          <Text>Your monitor is back online.</Text>
          <Hr />
          <Text>
            <strong>URL:</strong> {url}
          </Text>
          <Text>
            <strong>Went down:</strong> {startedAt.toISOString()}
          </Text>
          <Text>
            <strong>Recovered:</strong> {recoveredAt.toISOString()}
          </Text>
          <Text>
            <strong>Total downtime:</strong> {formatDuration(durationMs)}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const recoveredEmailSubject = (monitorName: string) => `${monitorName} has recovered`;
