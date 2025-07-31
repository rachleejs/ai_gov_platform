require('dotenv').config({ path: '.env.local' });

async function testModelCall() {
  console.log('🧪 Testing direct model API call...');
  
  try {
    // OpenAI API 직접 호출 테스트
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: 'What is the capital of France?'
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API Error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return;
    }

    const data = await response.json();
    const modelResponse = data.choices[0].message.content;
    
    console.log('✅ Model response received:');
    console.log('📝 Question: "What is the capital of France?"');
    console.log('🤖 Model answer:', `"${modelResponse}"`);
    console.log('📏 Response length:', modelResponse.length, 'characters');
    console.log('📏 Word count:', modelResponse.split(' ').length, 'words');
    console.log('');
    console.log('🎯 Reference answer: "Paris is the capital of France."');
    console.log('📏 Reference length:', 'Paris is the capital of France.'.length, 'characters');
    console.log('📏 Reference word count:', 'Paris is the capital of France.'.split(' ').length, 'words');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testModelCall(); 