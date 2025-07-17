import searchGames
import sys
from googlesheets import sheet_initializer


game_name = input("Type the name of the game you want to add to your backlog:")


while len(game_name.strip()) == 0:
   print("Actually write a name buddy")
   game_name = input("Type the name of the game you want to add to your backlog again...")

final_game = searchGames.search_games(game_name)
if final_game == -1:
    sys.exit(0)

sheet_var = sheet_initializer(final_game)
if sheet_var == -1:
    sys.exit(0)

print(f"Added {final_game.get('name')} to the backlog")


