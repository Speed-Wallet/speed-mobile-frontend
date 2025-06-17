
async function getTokenInfo(tokenAddress: string) {
    const tokenInfoResponse = await (
        await fetch(`https://lite-api.jup.ag/tokens/v1/token/${tokenAddress}`)
    ).json();
    console.log(tokenInfoResponse);
    return tokenInfoResponse;
}
// getTokenInfo('3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh')
getTokenInfo('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')