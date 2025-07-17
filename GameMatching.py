from rapidfuzz import fuzz, process, utils



def gamematcher(game_names, original_input):
    """
    Returns the name (a string) of the users desired game. game_names is a list of game names (can be empty).
    Original input is what the user originally typed in to search for the games.
    Fail-safe for if none of those games are the desired ones is to type STOP when prompted.
    """

    list_of_games = process.extract(original_input, game_names, scorer=fuzz.WRatio,
                                        processor=utils.default_process, limit=5, score_cutoff=80, )
    game_len = len(list_of_games)

    if game_len == 0:
        print("Couldn't find your game, restart and try writing it better.")
        return None
    elif game_len == 1:
        final_game = list_of_games[0][0]
        return final_game
    else:
        print("Which of these games did you mean. If you don't recognize these, type STOP to end the program and "
              "specify the game (writing the full title works)")
        for num in range(game_len):
            print(f"{num + 1}. {list_of_games[num][0]}")
        while True:
            try:
                choice = input('Input number: ')
                if choice.strip() == 'STOP':
                    return None
                choice = int(choice)
                if 1 <= choice <= game_len:
                    break
                else:
                    print("Number not in range. Please try again.")
            except ValueError:
                print("Just write the number, nothing else.")

        final_game = list_of_games[choice - 1][0]
        return final_game
