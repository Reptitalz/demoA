// src/ai/flows/extract-amount-flow.ts
'use server';

/**
 * @fileOverview An AI flow to extract a monetary amount from an image.
 *
 * - extractAmountFromImage - A function that takes an image Data URI and returns the largest monetary amount found.
 * - ExtractAmountInput - The input type for the flow.
 * - ExtractAmountOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { genkit } from 'genkit';

const ExtractAmountInputSchema = z.object({
  image: z.string().describe("A Data URI of an image, expected to be a receipt or transfer screenshot. Format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ExtractAmountInput = z.infer<typeof ExtractAmountInputSchema>;

const ExtractAmountOutputSchema = z.object({
  amount: z.number().describe('The largest numerical monetary value found in the image. Return 0 if no amount is found.'),
});
export type ExtractAmountOutput = z.infer<typeof ExtractAmountOutputSchema>;


const extractAmountPrompt = ai.definePrompt({
    name: 'extractAmountPrompt',
    input: { schema: ExtractAmountInputSchema },
    output: { schema: ExtractAmountOutputSchema },
    prompt: `Analyze the following image, which is a screenshot of a bank transfer or payment receipt. 
    Your task is to identify and extract the main monetary amount of the transaction.
    
    - Look for figures preceded by '$' or followed by currency codes like 'MXN'.
    - If there are multiple numbers (like reference numbers, dates, or times), ignore them.
    - Focus on the largest, most prominent monetary value, which is likely the total transfer amount.
    - Extract only the numerical value, without currency symbols or commas. For example, if you see '$1,500.00', extract 1500.
    - If no clear monetary amount can be found, return 0.
    
    Image to analyze: {{media url=image}}`,
});


const extractAmountFlow = ai.defineFlow(
  {
    name: 'extractAmountFlow',
    inputSchema: ExtractAmountInputSchema,
    outputSchema: ExtractAmountOutputSchema,
  },
  async (input) => {
    const { output } = await extractAmountPrompt(input);
    return output || { amount: 0 };
  }
);


export async function extractAmountFromImage(input: ExtractAmountInput): Promise<number> {
    const result = await extractAmountFlow(input);
    return result.amount;
}

// Ensure the flow is included in the dev server
if (process.env.NODE_ENV === 'development') {
    genkit({
      plugins: [
      ],
      flows: [extractAmountFlow],
    });
}
