import os
from dotenv import load_dotenv
import requests
from GameMatching import gamematcher
from openai import OpenAI
from howlongtobeatpy import HowLongToBeat

load_dotenv()

RAWG_KEY = os.getenv('RAWG_API_KEY')

OPENAI_KEY = os.getenv('OPENAI_API_KEY')
# openai.api_key = OPENAI_KEY

client = OpenAI(api_key=OPENAI_KEY)



def search_games(game_name):
    """
    Method used for searching the RAWG API to find the details of the users wanted game. game_name is
    a string. Returns a dictionary of the form
    {'name': gamename, 'playtime': time, 'genre': tags, 'platforms': platform, 'rating': score, }.
    If some sort of error occurs during fuzzy string matching or in accessing the API, -1 is returned.
    """
    # Construct the API request URL and parameters
    URL = "https://api.rawg.io/api/games"
    params = {'key': RAWG_KEY,
              'search': game_name,
              'page_size': 20}

    try:
        # Make the GET request using requests
        response = requests.get(URL, params=params)

        # Check for successful response
        status = response.status_code

        if status == 200:

            # Parse JSON data
            data = response.json()
            games = data.get('results', [])
            game_list = []
            for item in games:
                game_list.append(item.get('name', "we don't know"))


            game = gamematcher(game_list, game_name)
            if game is None:
                return -1

            actual_game_dict = {}
            for dicks in games:
                if dicks.get('name') == game:
                    actual_game_dict = dicks
                    break

            # Extract relevant game details
            final = create_game_dictionary(actual_game_dict, game)

            # Return the dictionary
            return final


        elif status == 404:
            print("We couldn't find your game, try clarifying or just quit.")
            return -1

    except requests.exceptions.ConnectionError:
        print("Network error: Unable to connect to the API.")
        return -1
    except requests.exceptions.Timeout:
        print("Network error: The request timed out.")
        return -1
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return -1



def get_game_genre(desired_game, tags_list):
    """
    Returns a string of the genres that chatGPT thinks is representative of the game provided. Can give up to 5, but
    will always give at least one.
    """
    user_input = ("given this list of dictionaries of tags for the game "+ desired_game +", what are the tags that best "
                  "describe the game (it can be as short as 1 or as long as 5. it doesnt have to be 5, it "
                  "can be as many or as little as you wish, but 5 is the max). I'll stress again, you DO NOT have "
                  "to return 5 if you dont feel the need, most times its better to return less. If its not in english "
                  "dont include it. Return it as if you were returning a "
                  "string in python. So if you decided that the best tag to return is Horror and FPS, then you'd "
                  "return Horror, FPS. ONLY return the tags, no text before explaining that you completed the task"
                  + str(tags_list))

    response = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": user_input,
            }
        ],
        model="gpt-4o-mini",
    )

    return response.choices[0].message.content

def create_game_dictionary(game_dict, game):
    """
    Returns a dictionary of the form {'name': gamename, 'playtime': time, 'genre': tags, 'platform': platforms, 'rating': score}
    for a given game, game_dict is the dictionary of the game of the form above, and the variable game is the name
     of the game provided by the RAWG API.
    """
    rgt = {'name': game_dict.get('name')}

    stats = htb(game)
    rgt['playtime'] = stats[0]
    # genre
    tags = game_dict.get('tags')
    real_tags = get_game_genre(game, tags)
    rgt['genre'] = real_tags

    # platform/s
    plat_list = game_dict.get('platforms')
    accum = []
    for plat in plat_list:
        accum.append(plat.get('platform').get('name'))
    plats = ', '.join(accum)
    rgt['platform'] = plats

    #ratings
    rgt['rating'] = stats[1]

    return rgt

def htb(name_of_game):

    lower_name = name_of_game.lower()
    results = HowLongToBeat().search(lower_name)
    for game in results:
        if lower_name == game.game_name.lower():
            return game.main_extra, game.review_score


