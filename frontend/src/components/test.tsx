import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

describe('<App />', () => {
  beforeEach(() => {
    // Mock the global fetch API to simulate a successful .NET API response
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            nodes: [
              {
                id: 'bundestag',
                name: 'Deutscher Bundestag',
                classification: 'parliament',
                location: 'Berlin (Reichstagsgebäude)',
                description:
                  'Das gesetzgebende Organ der Bundesrepublik Deutschland...',
                head: 'Bärbel Bas (Präsidentin des Deutschen Bundestages)'
              },
              {
                id: 'bmf',
                name: 'Bundesministerium der Finanzen',
                classification: 'ministry',
                location: 'Berlin (Detlev-Rohwedder-Haus)',
                description:
                  'Verantwortlich für die Finanz- und Steuerpolitik...',
                head: 'Bundesminister für Finanzen'
              },
              {
                id: 'aa',
                name: 'Auswärtiges Amt',
                classification: 'ministry',
                location: 'Berlin (Werderscher Markt)',
                description: 'Verantwortlich für die Vertretung...',
                head: 'Bundesministerin des Auswärtigen'
              }
            ],
            edges: [
              { from: 'bundestag', to: 'bmf' },
              { from: 'bundestag', to: 'aa' }
            ]
          })
      })
    )
  })

  it('should render the App with the network canvas and Bundestag node after loading', async () => {
    const { container } = render(<App />)

    // Verify loading screen is shown initially
    expect(screen.getByText(/Lade Daten vom .NET Backend/i)).toBeInTheDocument()

    // Wait for the async fetch to finish and display the Bundestag node
    const bundestagNode = await screen.findByText('Bundestag')
    expect(bundestagNode).toBeInTheDocument()

    // Verify brand title exists in the document
    expect(screen.getAllByText(/ZeigDenStaat/i).length).toBeGreaterThan(0)

    // Verify the zoomable network canvas exists
    expect(screen.getByTestId('network-svg')).toBeInTheDocument()

    // Verify abbreviation labels of ministries are present
    expect(screen.getByText('BMF')).toBeInTheDocument()
    expect(screen.getByText('AA')).toBeInTheDocument()

    // Verify that the details panel shows the Deutscher Bundestag by default
    expect(screen.getByText('Deutscher Bundestag')).toBeInTheDocument()
    expect(screen.getByText(/Bärbel Bas/i)).toBeInTheDocument()

    expect(container.firstChild).toBeInTheDocument()
  })
})
