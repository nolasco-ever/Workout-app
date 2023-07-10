export const mockArticles = [
    {
        id: 0,
        title: "The Benefits of Weight Training",
        image: 'https://wpassets.trainingpeaks.com/wp-content/uploads/2021/02/25090028/21027-Blog-1200x675-1.jpg',
        content: `
            Weight training is a form of exercise that has been around for many years. It involves using weights, such as dumbbells or barbells, to build strength and muscle. Weight training has many benefits, both physical and mental. Here are just a few:
        
            1. Increased strength and muscle mass: One of the most obvious benefits of weight training is that it can help you build strength and muscle mass. By challenging your muscles with weights, you stimulate them to grow and become stronger.
        
            2. Improved bone density: Weight training can also help improve bone density, which is especially important as we age. By putting stress on your bones, you encourage them to become stronger and more resilient.
        
            3. Reduced risk of injury: By building strength and improving your overall fitness level, weight training can help reduce your risk of injury. Strong muscles and bones can better support your body during physical activity, which can help prevent common injuries like sprains and strains.
        
            4. Improved mood and mental health: Weight training can also have positive effects on your mental health. Exercise releases endorphins, which are natural mood-boosters. Regular exercise has also been shown to reduce symptoms of depression and anxiety.
        
            5. Increased metabolism: Finally, weight training can help increase your metabolism, which can make it easier to maintain a healthy weight. Muscle tissue burns more calories than fat tissue, so building muscle can help you burn more calories even when you're at rest.
        
            Overall, weight training is a great form of exercise that can help improve your physical and mental health in many ways. If you're new to weight training, it's a good idea to start with lighter weights and focus on proper form to avoid injury. With time and practice, you can gradually increase the weight and intensity of your workouts to see even greater benefits.
        `,
        description: "We should all prioritize both our physical and mental health. If you agree with this notion, then you should consider weight training.",
        authorData: {
            profilePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw8PEA8NDw8PDhAPEA8PDQ8PDQ8OEBAQFhEWFhUVExcYHiggGBolGxUVITEiJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGhAQGy0lIB0rLS8rLS0tLSstKysrKysrLS0tLS0tLS0vLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tLf/AABEIALcBEwMBIgACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAAAAQIFAwQGBwj/xAA9EAACAQIEAwUGBAQEBwAAAAAAAQIDEQQFEiExQVEGE2FxgQciMpGhsSNCUmIUwdHwM0OCkhZTcrLS4fH/xAAZAQEAAwEBAAAAAAAAAAAAAAAAAQIEAwX/xAAkEQEAAgEEAgICAwAAAAAAAAAAAQIRAxIhMRNBMlEEcUJhof/aAAwDAQACEQMRAD8A9VuMgNMCaY7kENASAQASuO5EAJXFcQrgSuFyNwAdwuRFcCdwuV+aZvh8LDvK9WFKPLVJJvyXNnEZh7WMNGTjRoVKq/XKSpL5WbsMpw9HuLUeP432qYuVu5oUqTW7u3VUl9AwPtZrJpV6EHybi2t+qRGYTtl7DcLnGZH2/wALWvGtJUJbaZS2i149GdbSrRmlKEoyT3Ti0015onKJjDNcdzHcdwhO47mO47gTuNMhcEwMtwuY7juBO4XIXHcCaY7kLjuBO4XI3HcCQEbgBpXBMhcdwMiGRQ0BIBABIAQAAgYgHcBAApNLd7JcWec9rfaUqM5YfAxjUlBuNTET96mpc1TS+Lze3mWntTzLuME4JtSrvuo2k090235WR4PXlJfDwXXh6kTK0QsM0zGriKkq1arKrUk3dyd/RdF4FdOs4u+/iYY1b7SVvFcArOW1kmnwd9yFm7TqJpSi7c108V4G0mrXlHbqrXT8SppTag00076o+Bv4HHfhuMruSvZ7brkvuRMJhu06Vlzst/dbul1tzXzOi7GZ9PBV1PU6lBpxqQg+V9movmcXUxk1yaSe2/IMLj9L1NvyS4hPEvpfKM3w+Lh3lCopqyuuEo36rkb54P2d7SvB1oYiG9OotE1binJX9dk/XxPa8qzCGJpRrQs4yV002/uk7+haJy5zGG8NCAlUxoQ0AwEAEgEMBjIjAlcZAdwJAIANEaIjQE0SRBEkBIZEYDQxAANiBgAAIAPD/avnnf4zuUtMMMnTV1ZylKzk/okjh6SdWSgldvlyXmXPb2o5ZjjnLlXlHpZJJL6IydjsCnNza5bHO04jLtSuZiGbA9mYtLVxLvBdmqPBwv5l7Qw66FnhaCRjnUtPturp1j05yXYvDz30tf6th4fsLQUk95LnHh9TsqaRmw6W/wAhvt9myv05fE9jMNOOmNPR+5bv6nMZr7PpQUpU5arcFzPW6UFzsRxGHXKzEXvHtE0pPp881MHVpfhVIte8pRv/AH5HsvsqzRVaNTDv46DT84S/o0/oUntGyyLoRqJK9OXLbZ2uVPsoxEoZgqavarTmpWtb3d9/katO+6MsmtTbPD21DIkjszgYhoAGIAkxiGEGAhgNDIoYDAAA0CSIoYE0NEUSAaGK4wGAgAAAAAQAwPnLt3h3HH4vV+aq5+jZZdjo3jq8SXtXw0qeZVHJ7VIQqRb/AE6dNvnFm1l1SFDC05W303t1fE4avWGnQ7y6ii/U3sO27cPmcXhsTiMRG8Kbm7NrWvdttZqLduDf9RzWYUve090utOCUfVLb5pnHw/20eaPp6NQp8H8yWG4zb4JnIZF2lmrxxD0tJtPS7Tjd8Euf/rqdBWzylGneKm5SlspUqsF04yilxKzSYXi8TGVtTcpcmZlFrijhMR2yrtuNKGmEGozqaHNuV1dU47J8eL4eLvbJQ7UVZtq2JWm6TnFK9nx2go/NE+KVfLHS17XRUsPUXhc4n2eK2ZUJcLuotn+ySudhLFwxFKpGT1wknGTaUZ05NWWtLZq/5klbba12uW9mNGo8dTiltRVaU5W/LuuPXdHbRiY4lw15ieYe0jIoaNDIkMiMBgAAMZEYDAAAYxIYAAABooaEMCSGJDAYxDABiAAAQAFzWzPEd1RrVb20U5yT8VF2+psmpmuH72hWpfrpzj622InrhNcZjLxjtNiMQ6NPEd5NyW+vVecLtJxjLiot2duF0ZMLlsWp1pXlUqwTqSk23KTd29+G6RHNLzpQor4VGMp+Sd39S27tpLSr2Vrbbx5rfbo/Qx1vOIejfTiLTwjleMlCbi4tU3CS1RTUVZNceMnvwVjBhsxrSVWNW2mEHJOVJq76Rad738+bL2iozoaobOFo7LdX4pprblxKPM4VJcammO6fwq+/gi+7HCs6e7nKsnj+/wBFoyjKnOEtk94t238NWg9CxNGnVwL1OzjKPvNu0d+fhwONyjBpcvdUk43+Jvfj4bvb+Z6ZktCLoKLSalxTSdylrZnhatcVnLzzF4ipTgu7dOGmm52glK8m05W8LtmbJs5xHczrzUJ2moKnGnJTd+dvzJW5dfQtamXRlUqYeVozpOWhcp0m04yjd9LJ77NeRv4Ogo2g4267WLTaOsKxSe01TdSMakaMY604Tu01pad01zOe9nNKdDEYyavKGrRUnJSteMtVovgvjf8AtOvxU3TioxtKpLamurXGUv2q92/5tJ1OSU1Ro46nF8KlSUertRim348fmRvmIPHFrRDt0xo18DJulTb4uEb/ACM6NcTmMsFoxMwkSREaJQYAADGIdwAaEMBjIjAYCGBojAYDQ0IYDAEMBAAAIAAAABAeWZ/lGivWim47zila+qlPdW6fF9COXVddOnJ84pS81s/sd5nmQrEtVIy0VErbq8ZLlfmvM82WrDSrUJpaqNSonZ3Vr329H9TJak1y9CmrF8fa+nQhJX0pu3Hn8ylrRp62ktTXF8bepsZpmv8AD0FKK1TqXVPmkkt5P5r5nIxzWs09EWm77pb3KRWZdp1K1d3hKFmk2vA7TK4/hpcLHiWBxOLhNSdObTe70Ph6HXvtVi1FUaGGnJ2TdRwk+avtwfzLbMK+TMdO0zTLo1f8SGqUd4Si3CS8mt0zTy3DRqNacRW912cW6baa5O8b39Sjy/OsdFz72k9k5aXHTt+31NKfaGUa8a6pOnvFYiN+MG0lK3Jr7X8CJrhMWj29BqYWFOLaV5S+KUm5Sl5t7+hzuUYepNSnpajW16ZbPVrm7W8o/Yts1x+mk533UG16I2sgwbp0MPFq2ilBb83pVxFd8qTqePlawjZJLgkkiQho2vNMaIokgGAAAxoQASAQ0AxiQAMBABqIYDQAMQASQAgYAAgAAEAAAgADyjt1h3HHVUv8yMKlut4aX/2nq7POvapRcJ4fEr9MoSfgndfdlLxmHTTnFlHlEo16Mac0nKjem0+cWl/4/U1Z5dVo19VKS/hpu+nStVJ33T23RrYHFaW6kWlq2l59S4w2Junqu73MvUt9OXSZZlNOtusSuMW4rTqUHC/Dk77HUYDJacIRbrNtTld+78Cv9TzelmFGErSnp6qxd5RmOFlJRdTVe9ovUXjH0WrM/wA/8W3aeE3TVLB1O8rTSi2pvTTvZ6r+T2X2KP8A4dUI04VKkqtV272rN3clfVNu/KysvNHWUoU4q8Fa/P8AoVmb1Pyc5bPwj/dilpWhVZnW/iJQpR4TkqUfKUtL+jO/RwfZql3+MTslTwylJ9NT92C892/9J3ho0a4qw69s2SBCGdXAySIoYDGhDAaAQwGAhgNDEgAYCADWGAwEA0AAhgACAAAQhgAgAAA5Pt/RU6dKL3T7xP5ROrOb7bL8Oi/3y+xTU+Mumj84eQVKbw9RwnfS/gfJotsFmCaSdlZbm9jsFCotMldPn08jnsXllSjdxvOHh8S/qZ+Lftr5pPHS9lhoVnv7qtu9uFupb5Rg6EJLu7uSbSbvy48UcXQzPQua63T/AL/+GzhM/wBLbUmui36E7ZT5a5em182hStF2XLyOdxGaSrS0wWupUbVOPrxfRJHNYeriMVLTTjOTk37zTst+b5cTvezvZ6OFi5yeuq170306R8Cs1ivZvm3S97L5ZHDYeMVZzm3KrL9Urv6Lh6Fwa+B/w4eX82bBqr1DDf5SaGiIyyqSGiJIBghDAaAAAYCGA0AgAYAIDEMBgIBgAgGACEMTABDE2ACIyqdEQi23uBhzXGrD0KuIa1KnByUV+Z8l8zgsRm9fExXfSi7SvGMYpKO3zZ6BjcIq1CpQlwqQlB+F1a55tGlKDcJrTKDcZrpJOzM+vMx+mr8eKzmfaahcHRTumkTpmxKlzM8NMtGjkkJN8tXRcGXGG7FYWylLVJ9W/tYlgobo6PDPZI6RMudohgwmWUqKUacFGytw3fi+pmqKyNlmtiStk1alPPVRcadSH4aXxxu5J+Mea48C/ptSjGcWpQklKMlvFp80zjMTTu3fqdt2Vwrjg6UZfm1zS6RlOUo/Ro7aOpNuJcfyNKKxuj2iM26mGVlydjWnTa4mhlJDIjAaGIAJAIAJAJAAxkRgMQABEBgAgJCAQDEwEJjV3wMtOmBi0PyF3SNiwaQMGhEXAztEWiRFRvv8yi7Qdn1XvWpWjWS3T2jVS4X6S6P0fhfrbcyJXK2rExiVq2ms5h5d3coScJxcZRdpRkmmn4o2qW6sd7j8qo4hJVYamtozT0zj5SXLw4FK+yc4SvSqqcf01FpkvVbP5IzW0bR01V16z3wqcJGz34F3hpbGKWT4iP8AlN/9LjL7MzUsFiOHc1PVJfcrtn6Xm1Z9sykYK25YUsqrtL3Yw66pq69I3v8AM3sNkdNb1ZOs/wBLWmn/ALefq2T47SpOrWqhyvJXiJqclain7z/5n7Y+HV/z4djJWVltyXgh3S2XokRNFKRSMQz6mpN55Y5owyRnkY5I6ObUqU15GKVNrexvKBkUQKsZu1MOnw2Zpzg4uzICAQwAdxAAxkR3ABiuAEgAYAIYgBilDchUlyNil7yuBGETLawRQ2SFOPMjFmSD5EJRALEZRJJjYGKxJIGiUUBKLMsWiMUSSIGWNiSkYkhgZlIHIxoaAYwQAJkGjIKwELDGkEiQrEKlJSVmZbABVVabi7P0ZA38fTvFPp9ivuQGAgAYCAB3AQAZkAAAxMQAa7Zs5bPeUfC4ASM9RWCm7oAAi9jI90AECDQgAAJJAAGRGRIAAdgsAAMaAAJDAAAQwASIzAAJtEI/E/QAAKiumupTNW2AAAAAAuFwAAAAA//Z',
            name: 'Phil McCracken',
            date: 'April 16, 2023',
            viewCount: '2,160'
        }
    },
    {
        id: 1,
        title: "The Importance of Sleep for a Healthy Lifestyle",
        image: 'https://media.cnn.com/api/v1/images/stellar/prod/220823045808-01-lack-of-sleep-selfish-stock-image.jpg?c=original',
        content: `
            In today's fast-paced world, getting enough sleep can be a challenge. However, sleep is an essential component of a healthy lifestyle.
        
            Improved physical health: Sleep plays a crucial role in repairing and rejuvenating our bodies. During sleep, the body produces hormones that help repair tissues and fight off infections. Lack of sleep has been linked to a range of health problems, including obesity, diabetes, and heart disease.
        
            Better mental health: Sleep is also important for our mental health. Lack of sleep can lead to anxiety, depression, and other mood disorders. Getting enough sleep can help improve our mood, increase our ability to cope with stress, and enhance our overall sense of well-being.
        
            Improved cognitive function: Sleep is essential for brain function. During sleep, the brain processes and consolidates memories, helps us learn and retain new information, and prepares us for the next day's activities. Getting enough sleep can help improve our concentration, productivity, and problem-solving skills.
        
            Increased energy and productivity: Getting enough sleep can help us feel more alert, focused, and energized throughout the day. This can help us be more productive at work or school, and can also improve our ability to engage in physical activities.
        
            Reduced risk of accidents: Finally, getting enough sleep can help reduce the risk of accidents. Lack of sleep has been linked to an increased risk of car accidents, workplace accidents, and other types of accidents that can cause injury or death.
        
            In conclusion, getting enough sleep is essential for a healthy lifestyle. If you're having trouble sleeping, there are many things you can do to improve your sleep habits, such as establishing a regular sleep schedule, creating a relaxing sleep environment, and avoiding caffeine and other stimulants before bedtime. By prioritizing sleep and making it a part of your daily routine, you can reap the many benefits that come with a good night's sleep.
        `,
        description: "Learn why sleep is so important for a healthy lifestyle and the many benefits it provides.",
        authorData: {
            profilePhoto: 'https://www.shutterstock.com/shutterstock/photos/1437938108/display_1500/stock-photo-smiling-african-american-millennial-businessman-in-glasses-isolated-on-grey-studio-background-1437938108.jpg',
            name: 'Ben Dover',
            date: 'March 04, 2023',
            viewCount: '5,372'
        }
    },
    {
        id: 2,
        date: 'April 12, 2023',
        title: "Losing Fat: It's Not Just About Exercise",
        image: 'https://www.usmagazine.com/wp-content/uploads/2023/01/Weight-Loss-Stock-Photo.jpg?quality=86&strip=all',
        content: `
            Many people believe that going to the gym is the key to losing fat. While exercise is certainly important for overall health, it's not the only factor that determines whether you'll lose fat or not. In fact, what you eat plays a much bigger role in weight loss than exercise alone.
            
            When it comes to losing fat, the most important factor is creating a caloric deficit. This means that you need to burn more calories than you consume. Exercise can help you burn calories, but it's much easier to consume calories than it is to burn them off. This is why diet plays such a critical role in weight loss.
            
            To create a caloric deficit, you need to be mindful of what you eat. This doesn't mean you have to give up all your favorite foods or go on a strict diet. Instead, focus on making small, sustainable changes to your eating habits. For example, you could start by reducing your portion sizes or swapping out high-calorie foods for lower-calorie options.
            
            Another important aspect of losing fat is getting enough protein. Protein is essential for building and maintaining muscle, which can help boost your metabolism and burn more calories. Aim to include a source of protein with every meal and snack.
            
            In conclusion, if you want to lose fat, it's not just about going to the gym. While exercise is important, what you eat plays a much bigger role in weight loss. Focus on creating a caloric deficit by making small, sustainable changes to your eating habits and getting enough protein. With time and consistency, you'll start to see results. 
        `,
        description: "Exercise alone isn't enough to lose fat. You need to pay attention to what you're consuming and how your diet plays a bigger role in weight loss.",
        authorData: {
            profilePhoto: 'https://previews.123rf.com/images/lenanet/lenanet1711/lenanet171100048/92786934-beautiful-woman-headshot-over-white-background.jpg',
            name: 'Eileen Dover',
            date: 'April 12, 2023',
            viewCount: '17,723'
        }
    },
    {
        id: 3,
        title: "Why Proper Form Is More Important Than Lifting Heavy Weights",
        image: 'https://images.pexels.com/photos/116077/pexels-photo-116077.jpeg?cs=srgb&dl=pexels-binyamin-mellish-116077.jpg&fm=jpg',
        content: `
          When it comes to weightlifting, many people get caught up in the numbers. They focus on lifting as much weight as possible, thinking that the heavier they lift, the more progress they'll make. However, this couldn't be further from the truth. Proper form is far more important than lifting heavier weights, and here's why:
      
          You'll reduce your risk of injury: If you lift weights with improper form, you're putting yourself at risk for injury. When you lift too much weight or lift it improperly, you can cause damage to your joints, muscles, and tendons. These injuries can take weeks or even months to heal, which means you'll be sidelined from the gym and your workouts.
      
          You'll activate the right muscles: When you lift weights with proper form, you'll activate the right muscles. This means you'll get more out of your workouts and see better results. On the other hand, if you lift weights with improper form, you may be using the wrong muscles, which can lead to imbalances and poor results.
      
          You'll build a better foundation: Proper form is the foundation of weightlifting. When you start with proper form, you'll build a strong foundation that will help you progress in your workouts. This means you'll be able to lift heavier weights down the line, but only if you're lifting with proper form.
      
          You'll improve your mind-muscle connection: Lifting weights with proper form can help improve your mind-muscle connection. This means you'll be able to feel the muscles you're working more intensely, which can lead to better results. When you're ego lifting with improper form, you're not focused on your muscles as much as you're focused on the weight, which means you're not getting as much out of your workouts.
      
          Overall, proper form is far more important than lifting heavier weights. If you're new to weightlifting, it's important to focus on proper form before you start increasing the weight. This will help you build a strong foundation and see better results in the long run.
        `,
        description: "Reduce your risk of injury! Read how proper form is more important than lifting heavy weights and how it can help improve your results.",
        authorData: {
            profilePhoto: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?cs=srgb&dl=pexels-andrea-piacquadio-3777943.jpg&fm=jpg',
            name: 'Seymour Butts',
            date: 'March 17, 2023',
            viewCount: '4,354'
        }
    },
    {
        id: 4,
        title: "Bulking: Why a Small Calorie Surplus is Enough",
        image: 'https://media.self.com/photos/5873e3bce4f5ca1462a66ad4/4:3/w_2560%2Cc_limit/Count-calories-weight-loss.jpg',
        content: `
          Bulking is a common practice among fitness enthusiasts who want to build muscle mass. However, many people believe that they need to consume a massive amount of calories to achieve their bulking goals. This is not necessarily true. In fact, a small calorie surplus is enough for most people.
      
          When you're bulking, your goal is to gain weight in the form of muscle mass. To do this, you need to consume more calories than your body burns. This is known as a calorie surplus. However, the size of the calorie surplus you need depends on several factors, including your body composition, training volume, and genetics.
      
          Contrary to popular belief, you don't need to consume a massive amount of calories to bulk up. In fact, a small calorie surplus of 200-300 calories is enough for most people. This may not seem like a lot, but over time, it can add up and help you build muscle mass.
      
          Additionally, consuming a massive amount of calories can lead to unwanted fat gain. While it's true that you need to consume more calories than your body burns to build muscle mass, you don't need to go overboard. Consuming an extra 500-1000 calories per day may lead to excessive fat gain, which can be difficult to lose later on.
      
          If you're not seeing results with a 200-300 calorie surplus, you can try adding an extra 200-300 calories to your daily intake. However, it's important to keep in mind that the key to successful bulking is consistency. You need to consistently consume a calorie surplus over an extended period of time to see results. 
      
          In conclusion, you don't need to consume a massive amount of calories to bulk up. A small calorie surplus of 200-300 calories is enough for most people. Consuming more than that can lead to unwanted fat gain, which can be difficult to lose later on. Remember to be consistent and patient, and you'll see results over time.
        `,
        description: "Learn why a small calorie surplus is enough when bulking and how consuming too many calories can lead to unwanted fat gain.",
        authorData: {
            profilePhoto: 'https://st3.depositphotos.com/15754244/19097/i/600/depositphotos_190978340-stock-photo-happy-black-man-front-white.jpg',
            name: 'Hugh G. Rection',
            date: 'February 22, 2023',
            viewCount: '2,439'
        }
      }
];