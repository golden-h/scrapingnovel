*** Settings ***
Library    SeleniumLibrary
Library    Collections
Library    String

*** Variables ***
${BROWSER}    chrome
${URL}    https://chatgpt.com/g/g-6749b358a57c8191a95344323c84c1e1-dich-truyen-tieng-trung-do-thi
${TIMEOUT}    20s

*** Keywords ***
Open Translation GPT
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Set Selenium Implicit Wait    ${TIMEOUT}

Wait For Chat Ready
    Wait Until Element Is Visible    xpath://textarea[@id='prompt-textarea']    timeout=30s
    Sleep    2s

Send Text For Translation
    [Arguments]    ${text}
    Input Text    xpath://textarea[@id='prompt-textarea']    ${text}
    Press Keys    xpath://textarea[@id='prompt-textarea']    RETURN
    Sleep    2s

Get Translation Result
    Wait Until Element Is Visible    xpath:(//div[contains(@class, 'markdown')])[last()]    timeout=30s
    ${result}=    Get Text    xpath:(//div[contains(@class, 'markdown')])[last()]
    RETURN    ${result}

Translate Chapter
    [Documentation]    Translates a chapter using the specialized GPT
    [Arguments]    ${chapter_text}
    Open Translation GPT
    Wait For Chat Ready
    Send Text For Translation    ${chapter_text}
    ${translation}=    Get Translation Result
    Close Browser
    RETURN    ${translation}

*** Tasks ***
Translate Text
    [Documentation]    Main task to translate text using GPT
    ${input_text}=    Get Variable Value    ${input_text}    ${EMPTY}
    ${translation}=    Translate Chapter    ${input_text}
    Log    Translation Result: ${translation}
    RETURN    ${translation}
