import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { SentimentPulse } from './SentimentPulse';
import type { Student } from '../utils/pco';

describe('SentimentPulse', () => {
  it('renders loading state when students array is empty', () => {
    render(<SentimentPulse students={[]} />);
    expect(screen.getByText('Wait for data to load...')).toBeInTheDocument();
  });

  it('renders empty state when no students have prayer topics', () => {
    const students: Partial<Student>[] = [
      { id: '1', prayerTopic: null }
    ];
    render(<SentimentPulse students={students as Student[]} />);
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
  });

  it('renders word cloud with correct font sizing logic', () => {
    // Mock Math.random to make color/transform deterministic for testing
    const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const students: Partial<Student>[] = [
      { id: '1', prayerTopic: 'anxiety' },
      { id: '2', prayerTopic: 'anxiety' },
      { id: '3', prayerTopic: 'anxiety' },
      { id: '4', prayerTopic: 'health' },
      { id: '5', prayerTopic: 'health' },
      { id: '6', prayerTopic: 'finances' }
    ];

    render(<SentimentPulse students={students as Student[]} />);

    // There are multiple "Anxiety" text in the document (one in the cloud, one in summary),
    // so we get all and assert on the array length
    expect(screen.getAllByText('Anxiety').length).toBeGreaterThan(0);
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Finances')).toBeInTheDocument();

    // The component should identify 'Anxiety' as the top theme
    expect(screen.getByText('Anxiety', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/3 occurrences/)).toBeInTheDocument();

    // Check sizes
    // maxFreq = 3 (Anxiety), minFreq = 1 (Finances)
    // Anxiety should have largest font (1 + (3-1)/(3-1)*3 = 4rem)
    const anxietyEl = screen.getByText('Anxiety', { selector: '.word-cloud-item' });
    expect(anxietyEl).toHaveStyle('font-size: 4.00rem');

    // Finances should have smallest font (1 + (1-1)/(3-1)*3 = 1rem)
    const financesEl = screen.getByText('Finances', { selector: '.word-cloud-item' });
    expect(financesEl).toHaveStyle('font-size: 1.00rem');

    mathRandomSpy.mockRestore();
  });

  it('handles flat frequencies gracefully', () => {
     const students: Partial<Student>[] = [
      { id: '1', prayerTopic: 'anxiety' },
      { id: '2', prayerTopic: 'health' }
    ];

    render(<SentimentPulse students={students as Student[]} />);

    // When maxFreq === minFreq, it should return '2rem'
    const anxietyEl = screen.getByText('Anxiety', { selector: '.word-cloud-item' });
    expect(anxietyEl).toHaveStyle('font-size: 2rem');
  });
});